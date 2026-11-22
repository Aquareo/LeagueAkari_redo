# Top Lane Counter Assistant — statistical data integration

The V5 assistant has two distinct sources:

1. **Local, qualitative notes** in `top-matchups.ts` — fallback knowledge, not a win-rate ranking.
2. **Optional OP.GG matchup samples** — obtained through the officially documented public OP.GG MCP server **only when the user presses "获取最新数据"**.

## How it works

- During champion select, the app uses only enemy champions and TOP positions *already revealed by the League Client*. If the lane is unknown, the user chooses manually.
- The desktop main process calls the fixed OP.GG MCP endpoint, once for the selected enemy champion. It sends **only a champion alias**, not PUUID, account data or LCU credentials.
- It reads per-opponent `play` and `win` from the perspective of that enemy, then converts to candidate wins: `candidateWins = games - enemyWins`.
- Invalid or missing records are dropped. If sample size is below **200 games**, the app does not display that win rate as reliable. Candidate ordering uses the Wilson lower confidence bound of the observed win fraction, along with user familiarity and whether a pick is available.
- A 4-hour cache avoids unnecessary remote calls. The UI displays the lookup time and only shows the patch when OP.GG actually provided it.
- When the endpoint fails, the fallback is a direct link to **OP.GG's current counters page**, with optional champion matchup selection, so users can check patch, region, tier and sample details there.

## Important limitations

- The MCP tool does not currently expose reliable region and rank filters through this adapter. The UI **must not imply** its rate applies to a particular server/tier, or that historical sample counts match the player's current region. Consult the linked page for source filters.
- Third-party stats can lag behind the current game patch, and a high observed win rate does not imply a guaranteed lane counter. Beware survivorship bias, player skill, champion role mix and small samples.
- The public MCP endpoint may impose rate limits or change its schema at any time. Do not scrape its private internal API or redistribute OP.GG's datasets.
- The source and official matchup link remain visible when data is displayed. Permission from OP.GG for wider third-party app distribution should be confirmed separately; its public code license does **not automatically license data**.
- This integration does not circumvent Riot's policies or the project's explicit lack of Tencent server support.
- It does not automatically pick/lock champions or access hidden enemy picks.

## Build and testing

`yarn typecheck`, `yarn test`, `yarn build:win`.

Network runtime behavior, CORS-free Electron IPC, OP.GG endpoint response shape and visual appearance **still require Windows smoke testing**. The unit tests cover statistical normalization, error rejection, and source URLs but not OP.GG's service availability.
