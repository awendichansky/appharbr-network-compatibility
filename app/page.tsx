"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { CompatibilityResponse, NetworkCompatibility, Platform } from "@/lib/compatibility";

function formatDate(value: string | null): string {
  if (!value) return "Not provided by source";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function NetworkMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const hue = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <span
      className="network-mark"
      style={{ "--mark-hue": hue } as React.CSSProperties}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function RangeCell({ network }: { network: NetworkCompatibility }) {
  if (!network.supported || !network.supportedRange) {
    return <span className="unsupported">Not yet supported</span>;
  }
  const single = network.supportedRange.min === network.supportedRange.max;
  return (
    <div className="range-cell">
      <span className="version-chip">{network.supportedRange.min}</span>
      {!single && <span className="range-dash">—</span>}
      {!single && <span className="version-chip latest">{network.supportedRange.max}</span>}
    </div>
  );
}

function PlatformIcon({ platform, active }: { platform: Platform; active: boolean }) {
  const color = active ? "5B16C5" : "7C7187";
  return (
    <img
      className="platform-icon"
      src={`https://cdn.simpleicons.org/${platform === "ios" ? "apple" : "android"}/${color}`}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [sdkVersion, setSdkVersion] = useState("");
  const [data, setData] = useState<CompatibilityResponse | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (targetPlatform: Platform, sdk = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ platform: targetPlatform });
      if (sdk) params.set("sdk", sdk);
      const response = await fetch(`/api/compatibility?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as CompatibilityResponse & { error?: string; detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? payload.error ?? "Request failed");
      setData(payload);
      setSdkVersion(payload.requestedSdkVersion);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load compatibility data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(platform);
  }, [load, platform]);

  const filteredNetworks = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return data.networks;
    return data.networks.filter(
      (network) =>
        network.name.toLocaleLowerCase().includes(normalized) ||
        network.id.toLocaleLowerCase().includes(normalized),
    );
  }, [data, query]);

  const apiPath = useMemo(() => {
    const params = new URLSearchParams({ platform });
    return `/api/compatibility?${params}`;
  }, [platform]);
  const apiSdkPath = `${apiPath}&sdk=${encodeURIComponent(sdkVersion || "VERSION")}`;

  async function copyApiUrl() {
    await navigator.clipboard.writeText(`${window.location.origin}${apiPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AppHarbr compatibility home">
          <img
            className="official-logo"
            src="https://appharbr.com/wp-content/uploads/2022/09/APPHARBR-LOGO-COLOR-ON-WHITE-RGB-medium-copy-2.png"
            alt="AppHarbr by GeoEdge"
          />
        </a>
        <div className="header-right">
          <span className="live-pill"><span /> Live configuration</span>
          <a className="text-link" href={apiPath} target="_blank" rel="noreferrer">
            JSON API <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><ShieldCheck size={15} /> Publisher resource</div>
        <h1>Network compatibility,<br /><span>clearly mapped.</span></h1>
        <p className="hero-copy">
          Check the ad network adapter versions supported by any AppHarbr SDK release—across iOS and Android.
        </p>

        <div className="controls-card">
          <div className="platform-tabs" role="tablist" aria-label="Platform">
            {(["ios", "android"] as Platform[]).map((item) => (
              <button
                key={item}
                className={platform === item ? "active" : ""}
                onClick={() => { setPlatform(item); setSdkVersion(""); setQuery(""); }}
                role="tab"
                aria-selected={platform === item}
              >
                <PlatformIcon platform={item} active={platform === item} />
                {item === "ios" ? "iOS" : "Android"}
              </button>
            ))}
          </div>

          <label className="version-select">
            <span>AppHarbr SDK version</span>
            <div>
              <select
                value={sdkVersion}
                onChange={(event) => {
                  const next = event.target.value;
                  setSdkVersion(next);
                  void load(platform, next);
                }}
                disabled={!data || loading}
              >
                {(data?.availableSdkVersions ?? []).slice().reverse().map((version) => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
          </label>

          <button className="refresh-button" onClick={() => void load(platform, sdkVersion)} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            {loading ? "Updating" : "Refresh data"}
          </button>
        </div>
      </section>

      <section className="content-shell">
        {error && (
          <div className="error-banner" role="alert">
            <CircleAlert size={19} />
            <div><strong>Live data is temporarily unavailable.</strong><span>{error}</span></div>
            <button onClick={() => void load(platform, sdkVersion)}>Try again</button>
          </div>
        )}

        <div className="summary-grid">
          <article className="summary-card primary-summary">
            <span className="summary-label">Selected release</span>
            <strong>{sdkVersion || "—"}</strong>
            <span>{platform === "ios" ? "iOS SDK" : "Android SDK"}</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Supported networks</span>
            <strong>{data ? `${data.supportedNetworkCount}/${data.networkCount}` : "—"}</strong>
            <span>at this SDK version</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Latest referenced SDK</span>
            <strong>{data?.latestReferencedSdkVersion ?? "—"}</strong>
            <span>{data?.latestSdkVersionSource === "derived" ? "derived from compatibility rules" : "reported by source config"}</span>
          </article>
          <article className="summary-card">
            <span className="summary-label">Source last updated</span>
            <strong className="date-value">{data ? formatDate(data.sourceUpdatedAt) : "—"}</strong>
            <span>UTC</span>
          </article>
        </div>

        <section className="matrix-card" aria-busy={loading}>
          <div className="matrix-header">
            <div>
              <span className="section-kicker">Compatibility matrix</span>
              <h2>{platform === "ios" ? "iOS" : "Android"} ad networks</h2>
              <p>Supported adapter range for AppHarbr SDK {sdkVersion || "—"}</p>
            </div>
            <label className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search networks"
                aria-label="Search networks"
              />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad network</th>
                  <th>Supported network versions</th>
                  <th>Top supported version</th>
                  <th>Introduced in AppHarbr</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredNetworks.map((network) => (
                  <tr key={network.id}>
                    <td><div className="network-name"><NetworkMark name={network.name} /><div><strong>{network.name}</strong><span>{network.id}</span></div></div></td>
                    <td><RangeCell network={network} /></td>
                    <td className="mono-value top-supported">{network.topSupportedAdapter ?? "—"}</td>
                    <td className="mono-value">{network.minimumAppHarbrForLatest ?? "—"}</td>
                    <td>{network.supported ? <span className="status-badge"><Check size={13} /> Supported</span> : <span className="status-badge muted">Unavailable</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredNetworks.length === 0 && (
              <div className="empty-state">No networks match “{query}”.</div>
            )}
            {loading && !data && <div className="loading-state"><RefreshCw className="spin" size={22} /> Reading live configuration…</div>}
          </div>
        </section>

        <section className="api-card">
          <div className="api-icon">{`{ }`}</div>
          <div className="api-copy">
            <span className="section-kicker">For automation</span>
            <h2>Use the normalized JSON API</h2>
            <p>Pass only a platform to retrieve every network and its complete version history. Add an optional <strong>sdk</strong> parameter for a point-in-time compatibility result.</p>
            <div className="api-examples">
              <div><span>All versions</span><code>GET {apiPath}</code></div>
              <div><span>Specific SDK</span><code>GET {apiSdkPath}</code></div>
            </div>
          </div>
          <div className="api-actions">
            <button onClick={copyApiUrl}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied" : "Copy request"}</button>
            <a href={apiPath} target="_blank" rel="noreferrer">Open JSON <ExternalLink size={15} /></a>
          </div>
        </section>

        <div className="method-note">
          <strong>How to read this table</strong>
          <p>The range spans the earliest through latest adapter version listed as compatible at or before the selected AppHarbr SDK version. Top supported version is the highest adapter version available for that network.</p>
        </div>
      </section>

      <footer>
        <div>
          <img
            className="official-logo footer-logo"
            src="https://appharbr.com/wp-content/uploads/2022/09/APPHARBR-LOGO-COLOR-ON-WHITE-RGB-medium-copy-2.png"
            alt="AppHarbr by GeoEdge"
          />
        </div>
        <p>Compatibility data is provided as a publisher convenience. Validate versions in your release workflow.</p>
      </footer>
    </main>
  );
}
