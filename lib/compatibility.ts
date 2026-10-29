export type NativePlatform = "ios" | "android";
export type Platform = NativePlatform | "unity";

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
  topSupportedAdapter: string | null;
  minimumAppHarbrForLatest: string | null;
  versionAnchors: SupportEntry[];
};

export type CompatibilityResponse = {
  platform: NativePlatform;
  requestedSdkVersion: string;
  latestReferencedSdkVersion: string;
  latestSdkVersionSource: "config" | "derived";
  availableSdkVersions: string[];
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  networkCount: number;
  supportedNetworkCount: number;
  networks: NetworkCompatibility[];
};

export type UnityNetworkCompatibility = {
  id: string;
  name: string;
  supported: boolean;
  android: NetworkCompatibility | null;
  ios: NetworkCompatibility | null;
};

export type UnityCompatibilityResponse = {
  platform: "unity";
  requestedSdkVersion: string;
  latestReferencedSdkVersion: string;
  latestSdkVersionSource: "changelog";
  availableSdkVersions: string[];
  nativeSdkVersions: { android: string; ios: string };
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  networkCount: number;
  supportedNetworkCount: number;
  networks: UnityNetworkCompatibility[];
};

export type CompatibilityApiResponse = CompatibilityResponse | UnityCompatibilityResponse;

const CONFIG_URLS: Record<NativePlatform, string> = {
  ios: "https://gw.geoedge.be/api/sdk_config/ios",
  android: "https://gw.geoedge.be/api/sdk_config/android",
};

const EXCLUDED_SDK_VERSIONS: Partial<Record<NativePlatform, Set<string>>> = {
  android: new Set(["2.90.0"]),
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

type UnityRelease = {
  version: string;
  android?: string;
  ios?: string;
};

// Unity releases without a new compatibility entry inherit the most recent
// explicitly verified native SDK pair at or before that release.
const UNITY_RELEASES: UnityRelease[] = [
  { version: "1.0.0", android: "2.15.0", ios: "1.9.0" },
  { version: "1.1.0", android: "2.15.1", ios: "1.9.2" },
  { version: "1.2.0" },
  { version: "1.3.0" },
  { version: "1.4.0", android: "2.17.0", ios: "1.12.0" },
  { version: "1.5.0", android: "2.19.0", ios: "1.14.0" },
  { version: "1.5.1" },
  { version: "1.5.2" },
  { version: "1.5.3", android: "2.19.2", ios: "1.14.2" },
  { version: "1.5.4", android: "2.19.3", ios: "1.14.2" },
  { version: "1.5.5", android: "2.19.3", ios: "1.14.3" },
  { version: "1.5.6", android: "2.19.5", ios: "1.14.4" },
  { version: "1.6.0", android: "2.19.6", ios: "1.15.0" },
  { version: "1.7.0" },
  { version: "1.7.1", android: "2.20.1", ios: "1.16.0" },
  { version: "1.8.0", android: "2.21.0", ios: "1.17.0" },
  { version: "1.9.0", android: "2.21.1", ios: "1.18.0" },
  { version: "1.10.0", android: "2.22.0", ios: "1.19.0" },
  { version: "1.10.1" },
  { version: "1.11.0", android: "2.23.0", ios: "1.20.0" },
  { version: "1.11.1" },
  { version: "1.12.0", android: "2.24.0", ios: "1.21.0" },
  { version: "1.13.0", android: "2.25.0", ios: "1.22.0" },
  { version: "1.14.0", android: "2.26.0", ios: "1.23.0" },
  { version: "1.15.0", android: "2.27.0", ios: "1.24.0" },
  { version: "1.16.0", android: "2.28.0", ios: "1.25.0" },
  { version: "1.17.0" },
  { version: "1.18.0" },
  { version: "1.19.0" },
  { version: "1.19.1", android: "2.32.0", ios: "1.29.0" },
  { version: "1.19.2", android: "2.33.0", ios: "1.30.1" },
  { version: "1.20.0", android: "2.34.0", ios: "1.31.0" },
  { version: "1.21.0", android: "2.35.0", ios: "1.32.0" },
  { version: "1.22.0", android: "2.36.0", ios: "1.33.0" },
  { version: "1.23.0", android: "2.37.0", ios: "1.34.0" },
  { version: "1.24.0", android: "2.38.0", ios: "1.35.0" },
  { version: "1.25.0", android: "2.39.0", ios: "1.36.0" },
  { version: "1.26.0", android: "2.40.0", ios: "1.37.0" },
  { version: "1.27.0", android: "2.41.0", ios: "1.38.0" },
];

const UNITY_CHANGELOG_UPDATED_AT = "2026-10-12T11:57:18.509Z";

const RESOLVED_UNITY_RELEASES = UNITY_RELEASES.reduce<
  Array<{ version: string; android: string; ios: string }>
>((releases, release) => {
  const previous = releases.at(-1);
  const android = release.android ?? previous?.android;
  const ios = release.ios ?? previous?.ios;
  if (android && ios) releases.push({ version: release.version, android, ios });
  return releases;
}, []);

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
  platform: NativePlatform,
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
  const excludedSdkVersions = EXCLUDED_SDK_VERSIONS[platform] ?? new Set<string>();
  const visibleNetworks = normalized.map(({ id, entries }) => ({
    id,
    entries: entries.filter(
      (entry) => !excludedSdkVersions.has(entry.minimumAppHarbrVersion),
    ),
  }));
  const sdkVersions = Array.from(
    new Set(visibleNetworks.flatMap((network) => network.entries.map((entry) => entry.minimumAppHarbrVersion))),
  ).sort(compareVersions);
  if (raw.sdk_latest_version && !excludedSdkVersions.has(raw.sdk_latest_version)) {
    sdkVersions.push(raw.sdk_latest_version);
  }
  const availableSdkVersions = Array.from(new Set(sdkVersions)).sort(compareVersions);
  const derivedLatest = availableSdkVersions.at(-1) ?? "0.0.0";
  const latestReferencedSdkVersion = raw.sdk_latest_version ?? derivedLatest;
  const requested = requestedSdk?.trim();
  const requestedSdkVersion =
    requested && !excludedSdkVersions.has(requested)
      ? requested
      : latestReferencedSdkVersion;

  const filter = networkFilter?.trim().toLocaleLowerCase();
  const networks = visibleNetworks
    .filter(({ id }) => !filter || id.toLocaleLowerCase() === filter || (DISPLAY_NAMES[id.toLocaleLowerCase()] ?? id).toLocaleLowerCase() === filter)
    .map(({ id, entries }) => {
      const eligible = entries.filter(
        (entry) => compareVersions(entry.minimumAppHarbrVersion, requestedSdkVersion) <= 0,
      );
      const latest = eligible.at(-1) ?? null;
      const topSupported = entries.at(-1) ?? null;
      return {
        id,
        name: DISPLAY_NAMES[id.toLocaleLowerCase()] ?? id,
        supported: eligible.length > 0,
        supportedRange:
          eligible.length > 0
            ? { min: eligible[0].adapterVersion, max: latest!.adapterVersion }
            : null,
        latestTestedAdapter: latest?.adapterVersion ?? null,
        topSupportedAdapter: topSupported?.adapterVersion ?? null,
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
  };
}

function canonicalUnityNetworkId(id: string): string {
  const normalized = id.toLocaleLowerCase();
  return normalized === "admob" || normalized === "gam" || normalized === "google"
    ? "google"
    : normalized;
}

function unityNetworkName(id: string, fallback: string): string {
  return id === "google" ? "Google (AdMob & Ad Manager)" : fallback;
}

function toUnityNetworkMap(networks: NetworkCompatibility[]): Map<string, NetworkCompatibility> {
  const result = new Map<string, NetworkCompatibility>();
  for (const network of networks) {
    const id = canonicalUnityNetworkId(network.id);
    const current = result.get(id);
    const isPreferredGoogleEntry =
      id === "google" && network.id.toLocaleLowerCase() === "admob";
    if (!current || isPreferredGoogleEntry) result.set(id, network);
  }
  return result;
}

function latestTimestamp(values: Array<string | null>): string | null {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).valueOf())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

export async function getUnityCompatibility(
  requestedSdk?: string,
  networkFilter?: string,
): Promise<UnityCompatibilityResponse> {
  const availableSdkVersions = RESOLVED_UNITY_RELEASES.map((release) => release.version);
  const latestRelease = RESOLVED_UNITY_RELEASES.at(-1)!;
  const requested = requestedSdk?.trim();
  const selectedRelease = requested
    ? RESOLVED_UNITY_RELEASES.find((release) => release.version === requested)
    : latestRelease;

  if (!selectedRelease) {
    throw new RangeError(`Unknown AppHarbr Unity SDK version: ${requested}`);
  }

  const [android, ios] = await Promise.all([
    getCompatibility("android", selectedRelease.android),
    getCompatibility("ios", selectedRelease.ios),
  ]);
  const androidNetworks = toUnityNetworkMap(android.networks);
  const iosNetworks = toUnityNetworkMap(ios.networks);
  const filter = networkFilter?.trim().toLocaleLowerCase();
  const ids = Array.from(new Set([...androidNetworks.keys(), ...iosNetworks.keys()]));
  const networks = ids
    .map((id) => {
      const androidNetwork = androidNetworks.get(id) ?? null;
      const iosNetwork = iosNetworks.get(id) ?? null;
      const fallbackName = androidNetwork?.name ?? iosNetwork?.name ?? id;
      const name = unityNetworkName(id, fallbackName);
      return {
        id,
        name,
        supported: Boolean(androidNetwork?.supported || iosNetwork?.supported),
        android: androidNetwork,
        ios: iosNetwork,
      } satisfies UnityNetworkCompatibility;
    })
    .filter(
      (network) =>
        !filter ||
        network.id.toLocaleLowerCase() === filter ||
        network.name.toLocaleLowerCase() === filter,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    platform: "unity",
    requestedSdkVersion: selectedRelease.version,
    latestReferencedSdkVersion: latestRelease.version,
    latestSdkVersionSource: "changelog",
    availableSdkVersions,
    nativeSdkVersions: { android: selectedRelease.android, ios: selectedRelease.ios },
    sourceUpdatedAt: latestTimestamp([
      UNITY_CHANGELOG_UPDATED_AT,
      android.sourceUpdatedAt,
      ios.sourceUpdatedAt,
    ]),
    fetchedAt: new Date().toISOString(),
    networkCount: networks.length,
    supportedNetworkCount: networks.filter((network) => network.supported).length,
    networks,
  };
}
