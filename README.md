# Pixel

Pixel is an independent Obsidian theme focused on long-form Markdown writing and knowledge management. The visual baseline is the H5 material system with the D1 balanced desktop layout.

The bundled-font budget and complete mobile behavior are still design decisions. This repository currently contains the production-oriented engineering scaffold, not a release-ready theme.

## Development

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run build
```

`src/scss/index.scss` is the only Sass entry point. Edit source modules under `src/`; do not edit the generated root `theme.css` directly.

For continuous compilation:

```sh
npm run dev
```

To deploy each build to the dedicated `dev-test` Vault, copy `.env.example` to `.env`, keep its confirmed `OBSIDIAN_VAULT_ID`, and set `OBSIDIAN_THEME_DIR` to that Vault's absolute, non-symlink Pixel theme path. Deployment replaces only `theme.css` and `manifest.json` using atomic per-file writes; it does not delete other files in the destination or write elsewhere in the Vault.

Before committing or releasing:

```sh
npm run check
```

This verifies the manifest and compatibility map, release tag when applicable, network-asset policy, CSS and encoded-font budgets, and that committed `theme.css` exactly matches the Sass source. Run `npm test` to exercise the valid and rejected package paths plus recoverable watch and safe deployment behavior.

## Distribution contract

- `manifest.json` is the theme-version authority.
- `theme.css` is the only generated installable stylesheet.
- Runtime assets must be embedded; remote font and image requests are rejected.
- Release tags must exactly match `manifest.json.version`.

## License

Pixel is available under the [MIT License](LICENSE).
