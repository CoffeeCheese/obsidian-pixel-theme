# Bundled font sources

Pixel keeps the following unmodified upstream WOFF2 files and their SIL Open Font License 1.1 texts for audit. The release build embeds only Fusion Pixel into `theme.css`; code surfaces use Obsidian's configured monospace font and system fallbacks so the installable stylesheet remains within the community-directory size recommendation.

| Local file | Upstream release | SHA-256 |
| --- | --- | --- |
| `fusion-pixel-12px-proportional-zh_hans.woff2` | [Fusion Pixel 2026.07.20](https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.07.20), 12px proportional `zh_hans` WOFF2 | `9d8d2f0bae6214568c591c72f4f3e8cbc39b2eeda461861e521e45d966ccefac` |
| `JetBrainsMono-Regular.woff2` | [JetBrains Mono 2.304](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304), web font Regular | `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2` |
| `JetBrainsMono-Bold.woff2` | [JetBrains Mono 2.304](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304), web font Bold | `c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2` |

Fusion Pixel is Copyright (c) 2022 TakWolf. JetBrains Mono is Copyright 2020 The JetBrains Mono Project Authors. Pixel does not embed Source Han Sans CN; it appears only in the local/system CJK fallback stack.
