import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const tableId = formData.get('tableId') as string | null;

    if (!image || !tableId) {
      return NextResponse.json(
        { error: 'Image and tableId are required' },
        { status: 400 }
      );
    }

    // Fetch the table's chip denominations
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { chipDenominations: { orderBy: { value: 'asc' } } },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = image.type || 'image/jpeg';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const denominationList = table.chipDenominations
      .map((d) => `- ${d.label} chip (color: ${d.color}, value: $${d.value})`)
      .join('\n');

    const prompt = `You are a poker chip counter. Analyze this image of poker chips and count how many chips of each denomination are visible.

The table uses these chip denominations:
${denominationList}

Instructions:
- Count only clearly visible chips
- Match chips by their color to the denominations listed above
- If a chip color doesn't match any denomination, ignore it
- Be conservative — only count chips you can clearly see

Respond ONLY with a valid JSON array (no markdown, no explanation) in this exact format:
[
  { "label": "White", "color": "#FFFFFF", "value": 1, "count": 5 },
  { "label": "Red", "color": "#FF0000", "value": 5, "count": 3 }
]

If no chips are visible or the image is unclear, return an empty array: []`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON from response — strip any accidental markdown
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse chip data from image. Please try a clearer photo.' },
        { status: 422 }
      );
    }

    const chips: Array<{ label: string; color: string; value: number; count: number }> =
      JSON.parse(jsonMatch[0]);

    // Validate and filter
    const validChips = chips.filter(
      (c) =>
        typeof c.label === 'string' &&
        typeof c.color === 'string' &&
        typeof c.value === 'number' &&
        typeof c.count === 'number' &&
        c.count > 0
    );

    const total = validChips.reduce((sum, c) => sum + c.value * c.count, 0);

    return NextResponse.json({ chips: validChips, total });
  } catch (error) {
    console.error('Chip scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan chips. Please try again with a clearer photo.' },
      { status: 500 }
    );
  }
}
