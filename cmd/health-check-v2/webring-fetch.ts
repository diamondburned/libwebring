export async function checkAlive(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`unexpected response ${resp.status}`);
    }
    return true;
  } catch (err) {
    console.log(`${url} unreachable: ${err}`);
    return false;
  }
}
