const results = [{ status: "fulfilled", value: "hello" } as PromiseSettledResult<string>];
const a = results[0].status === "fulfilled" ? results[0].value : "";
