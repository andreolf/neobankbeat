# neobankbeat MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the
open [neobankbeat](https://www.neobankbeat.com) dataset — 379 verified-active neobanks —
to AI agents as tools. Ask Claude (or any MCP client) *"compare Mercury and Brex"* or
*"which European neobanks support stablecoins?"* and it queries the live dataset directly.

- **Dependency-free.** One file, `server.mjs`, no npm install. Node 18+.
- **Live data.** Fetches `https://www.neobankbeat.com/data.json` (cached 1h), so it's always current; falls back to the bundled copy offline.
- **Read-only, no keys.** MIT-licensed open data.

## Tools

| Tool | What it does |
|---|---|
| `search_neobanks` | Plain-language search — *"self-custody banks in Brazil"*, *"crypto banks for freelancers"*. Parses facets (region, feature, custody, country, category) + keywords. |
| `get_neobank` | Full verified record for one neobank (custody, license, cards, yield, stablecoins, KYC, regulation, geography, features, sources). |
| `compare_neobanks` | 2–4 neobanks compared field by field. |
| `list_by_country` | Neobanks headquartered in / available in a country. |
| `dataset_stats` | Totals + category breakdown + as-of note. |

## Install (Claude Desktop)

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`):

```json
{
  "mcpServers": {
    "neobankbeat": {
      "command": "node",
      "args": ["/absolute/path/to/neobankbeat/mcp/server.mjs"]
    }
  }
}
```

Restart Claude Desktop; the `neobankbeat` tools appear. Any MCP client that speaks the
stdio transport works the same way (point it at `node mcp/server.mjs`).

## Test it by hand

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_neobanks","arguments":{"query":"European neobanks with stablecoins","limit":5}}}' \
  | node mcp/server.mjs
```

## Notes

- Field semantics are documented at [/llms.txt](https://www.neobankbeat.com/llms.txt); `null` = unverified, never "no".
- Cite the profile page for facts: `https://www.neobankbeat.com/n/<slug>/`.
- The same data is available as plain JSON at [/data.json](https://www.neobankbeat.com/data.json) and described by [/openapi.json](https://www.neobankbeat.com/openapi.json).
