export type Platform = "ios" | "android";

type RawSupportEntry = {
  adapter_ver?: string;
  min_sdk_ver?: string;
  ad_ver?: string;
  sdk_ver?: string;
};

type RawConfig = {
  native_ad_support?: Record<string, RawSupportEntry[]>;
  sdk_latest_version?: string;
  version?: string | number;
  config_ts?: string | number;
};

export type SupportEntry = {
  adapterVersion: string;
  minimumAppHarbrVersion: string;
};

export type NetworkCompatibility = {
  id: string;
  name: string;
  supported: boolean;
  supportedRange: { min: string; max: string } | null;
  latestTestedAdapter: string | null;
  minimumAppHarbrForLatest: string | null;
  versionAnchors: SupportEntry[];
};

export type CompatibilityResponse = {
  platform: Platform;
  requestedSdkVersion: string;
  latestReferencedSdkVersion: string;
  latestSdkVersionSource: "config" | "derived";
  availableSdkVersions: string[];
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  networkCount: number;
  supportedNetworkCount: number;
  networks: NetworkCompatibility[];
  source: string;
};

const CONFIG_URLS: Record<Platform, string> = {
  ios: "https://gw.geoedge.be/api/sdk_config/ios",
  android: "https://gw.geoedge.be/api/sdk_config/android",
};

const DISPLAY_NAMES: Record<string, string> = {
  adcolony: "AdColony",
  admob: "AdMob",
  amazon: "Amazon Publisher Services",
  applovin: "AppLovin",
  bidmachine: "BidMachine",
  bigoads: "BIGO Ads",
  chartboost: "Chartboost",
  facebook: "Meta Audience Network",
  fyber: "Fyber",
  gam: "Google Ad Manager",
  google: "Google Ad Manager",
  googlenextgen: "Google Next Gen",
  inmobi: "InMobi",
  ironsource: "ironSource",
  max: "AppLovin MAX",
  mintegral: "Mintegral",
  moloco: "Moloco",
  mytarget: "myTarget",
  nextgenadmob: "AdMob Next Gen",
  nextgengam: "GAM Next Gen",
  nimbus: "Nimbus",
  openwrapdfp: "OpenWrap DFP",
  pangle: "Pangle",
  prebid: "Prebid",
  prebidlife360: "Prebid Life360",
  pubmatic: "PubMatic",
  unity: "Unity Ads",
  verve: "Verve",
  viberexchange: "Viber Exchange",
  vungle: "Liftoff Monetize (Vungle)",
  yandex: "Yandex",
};

function compareVersions(a: string, b: string): number {
  const left = a.split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function decodeConfig(value: unknown): RawConfig {
  if (!value || typeof value !== "object") throw new Error("Invalid config envelope");
  const encoded = (value as { json?: unknown }).json;
  if (typeof encoded !== "string") throw new Error("Config envelope does not contain json");

  const candidates = [
    () => decodeURIComponent(encoded),
    () => Buffer.from(encoded, "base64").toString("utf8"),
    () => encoded,
  ];
  for (const decode of candidates) {
    try {
      return JSON.parse(decode()) as RawConfig;
    } catch {
      // Try the next known encoding.
    }
  }
  throw new Error("Unable to decode AppHarbr config");
}

function normalizeEntries(entries: RawSupportEntry[]): SupportEntry[] {
  return entries
    .map((entry) => ({
      adapterVersion: entry.adapter_ver ?? entry.ad_ver ?? "",
      minimumAppHarbrVersion: entry.min_sdk_ver ?? entry.sdk_ver ?? "",
    }))
    .filter((entry) => entry.adapterVersion && entry.minimumAppHarbrVersion)
    .sort((a, b) => compareVersions(a.adapterVersion, b.adapterVersion));
}

function timestampToIso(value: string | number | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  const millis = parsed < 10_000_000_000 ? parsed * 1000 : parsed;
  const date = new Date(millis);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export async function getCompatibility(
  platform: Platform,
  requestedSdk?: string,
  networkFilter?: string,
): Promise<CompatibilityResponse> {
  const source = CONFIG_URLS[platform];
  const response = await fetch(source, {
    headers: { Accept: "application/json", "User-Agent": "AppHarbr-Compatibility/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`AppHarbr config returned ${response.status}`);

  const raw = decodeConfig(await response.json());
  const support = raw.native_ad_support;
  if (!support || typeof support !== "object") {
    throw new Error("native_ad_support is missing from the AppHarbr config");
  }

  const normalized = Object.entries(support)
    .map(([id, entries]) => ({ id, entries: normalizeEntries(entries ?? []) }))
    .filter((network) => network.entries.length > 0);
  const sdkVersions = Array.from(
    new Set(normalized.flatMap((network) => network.entries.map((entry) => entry.minimumAppHarbrVersion))),
  ).sort(compareVersions);
  if (raw.sdk_latest_version) sdkVersions.push(raw.sdk_latest_version);
  const availableSdkVersions = Array.from(new Set(sdkVersions)).sort(compareVersions);
  const derivedLatest = availableSdkVersions.at(-1) ?? "0.0.0";
  const latestReferencedSdkVersion = raw.sdk_latest_version ?? derivedLatest;
  const requestedSdkVersion = requestedSdk?.trim() || latestReferencedSdkVersion;

  const filter = networkFilter?.trim().toLocaleLowerCase();
  const networks = normalized
    .filter(({ id }) => !filter || id.toLocaleLowerCase() === filter || (DISPLAY_NAMES[id.toLocaleLowerCase()] ?? id).toLocaleLowerCase() === filter)
    .map(({ id, entries }) => {
      const eligible = entries.filter(
        (entry) => compareVersions(entry.minimumAppHarbrVersion, requestedSdkVersion) <= 0,
      );
      const latest = eligible.at(-1) ?? null;
      return {
        id,
        name: DISPLAY_NAMES[id.toLocaleLowerCase()] ?? id,
        supported: eligible.length > 0,
        supportedRange:
          eligible.length > 0
            ? { min: eligible[0].adapterVersion, max: latest!.adapterVersion }
            : null,
        latestTestedAdapter: latest?.adapterVersion ?? null,
        minimumAppHarbrForLatest: latest?.minimumAppHarbrVersion ?? null,
        versionAnchors: entries,
      } satisfies NetworkCompatibility;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    platform,
    requestedSdkVersion,
    latestReferencedSdkVersion,
    latestSdkVersionSource: raw.sdk_latest_version ? "config" : "derived",
    availableSdkVersions,
    sourceUpdatedAt: timestampToIso(platform === "ios" ? raw.version : raw.config_ts),
    fetchedAt: new Date().toISOString(),
    networkCount: networks.length,
    supportedNetworkCount: networks.filter((network) => network.supported).length,
    networks,
    source,
  };
}
