"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const CustomerOutletsMap = dynamic(() => import("./CustomerOutletsMap"), { ssr: false });

type OutletResult = {
  outletId: string;
  outletName: string;
  companyId: string;
  companyName: string;
  foodType: "VEG" | "NON_VEG" | "BOTH";
  averageRating: number | null;
  ratingCount: number;
  matchedFoodNames: string[];
  address: string | null;
  city: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
};

type SortBy = "NEAREST" | "TOP_RATED" | "MOST_REVIEWED";

export default function CustomerLocation() {
  const [searchText, setSearchText] = useState("");
  const [outlets, setOutlets] = useState<OutletResult[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("NEAREST");
  const [foodFilter, setFoodFilter] = useState<"ANY" | "VEG" | "NON_VEG">("ANY");
  const [ratingFilter, setRatingFilter] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapOutlets, setMapOutlets] = useState<OutletResult[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const query = searchText.trim();
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams(query ? { search: query } : {});
        if (latitude !== null && longitude !== null) {
          params.set("latitude", String(latitude));
          params.set("longitude", String(longitude));
        } else if (!query) {
          params.set("directory", "1");
        }
        const response = await fetch(`/api/customers/nearby-businesses?${params.toString()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Search could not be loaded.");
        if (id === requestId.current) setOutlets(data.businesses || []);
      } catch (cause) {
        if (id === requestId.current) {
          setOutlets([]);
          setError(cause instanceof Error ? cause.message : "Search could not be loaded.");
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [searchText, latitude, longitude]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // If a query matches menu items, show only outlets carrying those items.
  // Otherwise the same query searches outlet names and their locations.
  const hasFoodMatches = searchText.trim().length > 0 && outlets.some((outlet) => outlet.matchedFoodNames.length > 0);
  const visibleOutlets = outlets
    .filter((outlet) => !hasFoodMatches || outlet.matchedFoodNames.length > 0)
    .filter((outlet) => foodFilter === "ANY" || (foodFilter === "VEG" ? outlet.foodType !== "NON_VEG" : outlet.foodType !== "VEG"))
    .filter((outlet) => !ratingFilter || (outlet.averageRating !== null && outlet.averageRating >= 4))
    .slice()
    .sort((a, b) => {
      const byDistance = (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      const byRating = (b.averageRating ?? -1) - (a.averageRating ?? -1) || b.ratingCount - a.ratingCount;
      if (sortBy === "TOP_RATED") return byRating || byDistance || a.outletName.localeCompare(b.outletName);
      if (sortBy === "MOST_REVIEWED") return b.ratingCount - a.ratingCount || byRating || byDistance;
      return byDistance || byRating || a.outletName.localeCompare(b.outletName);
    });

  async function openMap() {
    if (mapOutlets.length) {
      setShowMap((open) => !open);
      return;
    }
    setMapLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ directory: "1" });
      if (latitude !== null && longitude !== null) {
        params.set("latitude", String(latitude));
        params.set("longitude", String(longitude));
      }
      const response = await fetch(`/api/customers/nearby-businesses?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Map could not be loaded.");
      setMapOutlets(data.businesses || []);
      setShowMap(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Map could not be loaded.");
    } finally {
      setMapLoading(false);
    }
  }

  function outletCard(outlet: OutletResult) {
    const params = new URLSearchParams({ outletId: outlet.outletId, pickupOnly: "1", orderType: "SELF_RECEIVE" });
    if (latitude !== null && longitude !== null) {
      params.set("lat", String(latitude));
      params.set("lng", String(longitude));
    }
    return (
      <Link key={outlet.outletId} href={`/business/${outlet.companyId}?${params.toString()}`} className="relative flex h-full min-h-[190px] min-w-0 flex-col rounded-2xl border border-orange-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg sm:min-h-[230px] sm:rounded-3xl sm:p-5">
        <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-orange-400 via-amber-400 to-red-400" />
        <div className="flex min-h-10 items-start justify-between gap-1 pt-1 sm:min-h-12">
          <h3 className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-black leading-5 text-gray-950 sm:text-lg sm:leading-6">{outlet.outletName}</h3>
          <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-1 text-[9px] font-black text-amber-800 sm:px-2 sm:text-xs">★ {outlet.averageRating === null ? "New" : outlet.averageRating.toFixed(1)}</span>
        </div>
        <p className="mt-1 min-h-4 line-clamp-1 text-[10px] font-semibold text-gray-500 sm:min-h-5 sm:text-xs">{outlet.companyName}</p>
        <div className="mt-2 flex min-h-5 flex-wrap content-start gap-1 text-[9px] font-bold sm:min-h-6 sm:text-[10px]">
          {(outlet.foodType === "VEG" || outlet.foodType === "BOTH") && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">Veg</span>}
          {(outlet.foodType === "NON_VEG" || outlet.foodType === "BOTH") && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">Non-veg</span>}
        </div>
        <p className="mt-1 min-h-4 line-clamp-1 text-[10px] font-bold text-gray-600 sm:min-h-5 sm:text-xs">{[outlet.locality, outlet.city].filter(Boolean).join(", ") || "\u00a0"}</p>
        <p className="mt-1 min-h-4 text-[10px] font-semibold text-blue-700 sm:min-h-5 sm:text-xs">{outlet.distanceKm !== null ? `${outlet.distanceKm < 1 ? `${Math.round(outlet.distanceKm * 1000)} m` : `${outlet.distanceKm.toFixed(1)} km`} from you` : "\u00a0"}</p>
        <p className="mt-1 min-h-4 line-clamp-1 text-[10px] font-extrabold text-orange-700 sm:min-h-5 sm:text-xs">{outlet.matchedFoodNames.length > 0 ? outlet.matchedFoodNames.join(", ") : "\u00a0"}</p>
        <span className="mt-auto flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-3 text-xs font-extrabold text-white sm:min-h-12 sm:text-sm">{hasFoodMatches ? "Open menu" : "View menu"} →</span>
      </Link>
    );
  }

  return (
    <section id="discover" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-800">
        🏪 Choose Self Receive or Dine In at checkout. Order ahead from your favourite local outlet.
      </div>
      <div className="rounded-[28px] border border-orange-100 bg-white p-4 shadow-lg sm:p-6">
        <label htmlFor="customer-discovery-search" className="text-lg font-black text-gray-950 sm:text-xl">Find food or an outlet</label>
        <div className="mt-3 flex min-h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
          <span aria-hidden="true" className="text-lg text-gray-400">⌕</span>
          <input id="customer-discovery-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search food, outlet, city or locality" maxLength={100} autoComplete="off" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
          {searchText && <button type="button" aria-label="Clear search" onClick={() => setSearchText("")} className="rounded-full px-2 py-1 text-lg font-bold text-gray-400 hover:bg-gray-100">×</button>}
        </div>
        <p className="mt-2 text-xs font-medium text-gray-500">{searchText.trim() ? (hasFoodMatches ? "Matching food · nearest outlets first" : "Matching outlets and locations · nearest first") : "Nearby outlets · nearest and top-rated first"}</p>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="customer-sort">Sort outlets</label>
          <select id="customer-sort" aria-label="Sort outlets" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 outline-none focus:border-orange-400">
            <option value="NEAREST">Nearest</option><option value="TOP_RATED">Top rated</option><option value="MOST_REVIEWED">Most reviewed</option>
          </select>
          <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)} className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:border-orange-300">☷ Filters {(foodFilter !== "ANY" || ratingFilter) ? "•" : ""}</button>
          <button type="button" onClick={() => void openMap()} disabled={mapLoading} className="min-h-10 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-800 disabled:opacity-60">{mapLoading ? "Loading map…" : showMap ? "Hide map" : "🗺️ View all on map"}</button>
          {filtersOpen && <div className="absolute left-0 top-12 z-20 grid w-[min(19rem,calc(100vw-3rem))] gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <label className="text-xs font-extrabold text-gray-600">Food preference
              <select aria-label="Filter by food type" value={foodFilter} onChange={(event) => setFoodFilter(event.target.value as typeof foodFilter)} className="mt-1 min-h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800">
                <option value="ANY">All food</option><option value="VEG">Veg options</option><option value="NON_VEG">Non-veg options</option>
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2 text-xs font-bold text-gray-700"><input type="checkbox" checked={ratingFilter} onChange={(event) => setRatingFilter(event.target.checked)} className="h-4 w-4 accent-orange-600" /> 4★ and above</label>
            <button type="button" onClick={() => { setFoodFilter("ANY"); setRatingFilter(false); setSortBy("NEAREST"); }} className="justify-self-start text-xs font-bold text-orange-700">Clear filters</button>
          </div>}
        </div>
        {showMap && <CustomerOutletsMap outlets={mapOutlets} />}
        {error && <p role="status" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        {loading && visibleOutlets.length === 0 && <p className="mt-4 text-sm text-gray-500">Finding outlets…</p>}
        {!loading && !error && visibleOutlets.length === 0 && <p className="mt-4 text-sm text-gray-500">{searchText.trim() ? "No matching food or outlets found." : latitude === null ? "Allow location access to find nearby outlets within 5 km, or view all outlets on the map." : "No active outlets found within 5 km."}</p>}
        {visibleOutlets.length > 0 && <div className="mt-4 grid auto-rows-fr grid-cols-2 items-stretch gap-2 sm:gap-4">{visibleOutlets.map(outletCard)}</div>}
      </div>
    </section>
  );
}
