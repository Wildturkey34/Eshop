export async function GET() {
  try {
    const res = await fetch('http://ip-api.com/json');
    const data = await res.json();
    return Response.json({
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
    });
  } catch {
    return Response.json({ country: 'Unknown', city: 'Unknown' });
  }
}
