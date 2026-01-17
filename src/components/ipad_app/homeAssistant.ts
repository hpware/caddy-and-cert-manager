export async function setHomeAssistantData(device: string, state: string) {
  const domain = device.split(".")[0];
  const service = state === "off" ? "turn_off" : "turn_on";

  const reqFetch = await fetch(
    `${process.env.HOME_ASSISTANT_URL}/api/services/${domain}/${service}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity_id: device,
      }),
    },
  );

  if (!reqFetch.ok) {
    const errorText = await reqFetch.text();
    return new Response(errorText, { status: reqFetch.status });
  }

  const res = await reqFetch.json();
  return res;
}

export async function getHomeAssistantData(device: string) {
  const req = await fetch(
    `${process.env.HOME_ASSISTANT_URL}/api/states/${device}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );
  const res = await req.json();
  return res;
}
