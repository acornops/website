# Console proof capture provenance

- Source repository: `management-console`
- Source base commit: `82d2bfd489ec854142271fe7d8a7f920989ab598`
- Capture date: `2026-07-19`
- Fixture clock: `2026-07-15T08:30:00.000Z`
- Capture viewport: `1440x1000`, light theme, reduced motion
- Routes:
  - `/workspaces/fixture-workspace/overview`
  - `/workspaces/fixture-workspace/kubernetes-clusters/fixture-cluster/chat?session=fixture-session`

The assistant route is captured twice: once with the answer visible and run details collapsed, then again after expanding the run trace.

Capture-time anonymization replaces fixture operator identity, email, workspace name, and cluster name with generic demo values before pixels are recorded. No personal identity or environment-specific cluster label is present in the published assets.

The captures use the management console's deterministic standalone mock mode. That fixture harness was present as local work on top of the recorded base commit at capture time. The generated AVIF and WebP files are checked into this repository so production has no runtime dependency on the console source or fixture server.

To refresh the captures, start the console in mock mode on port 4186 and run:

```sh
node scripts/capture-console-proof.mjs
```
