"use client";
import { useEffect, useState } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { showSuccessMessage } from "components/global/AddToCartMessage";
import {
  AccessDenied,
  DashButton,
  DashIcon,
  EmptyState,
  ErrorState,
  InlineAlert,
  Pagination,
  SectionHeader,
  StatusPill,
} from "components/SellerDashboard/ui";
import LocationFormModal from "./LocationFormModal";
import { LocationsMeta, ShopLocation } from "./types";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";

const t = (s: string) => translateFunction(s);

type StatusFilter = "all" | "1" | "0";

/**
 * Locations section of the seller dashboard: list, filter, create, edit and
 * activate/deactivate the shop's warehouses / pickup points.
 *
 * There is no delete — the API exposes none, so a location can only ever be
 * deactivated (and deactivating does NOT detach it from products that already
 * reference it).
 */
export default function LocationsTab({
  sellerId,
  language,
  canRead,
  canCreate,
  canUpdate,
  canChangeStatus,
}: {
  sellerId: string;
  language?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canChangeStatus: boolean;
}) {
  const [locations, setLocations] = useState<ShopLocation[]>([]);
  const [meta, setMeta] = useState<LocationsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // `undefined` = modal closed, `null` = create, a row = edit.
  const [editing, setEditing] = useState<ShopLocation | null | undefined>(
    undefined,
  );

  const load = async (targetPage = page) => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await SellerDashboardService.getShopLocations(sellerId, {
        status: status === "all" ? null : (Number(status) as 0 | 1),
        page: targetPage,
      });
      if (!res?.success) {
        throw new Error(res?.message || t("Failed to load locations"));
      }
      const list: ShopLocation[] = res?.data?.locations || [];
      setLocations(Array.isArray(list) ? list : []);
      setMeta(res?.data?.meta || null);
      setPage(targetPage);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "LocationsTab.load", error: msg });
      setError(msg || t("Failed to load locations"));
    } finally {
      setLoading(false);
    }
  };

  // Filters reset to page 1; the page control passes its own target.
  useEffect(() => {
    load(1);
  }, [sellerId, status]);

  const handleToggleStatus = async (location: ShopLocation) => {
    if (!canChangeStatus || togglingId !== null) return;
    const next: 0 | 1 = location.status === 1 ? 0 : 1;
    setTogglingId(location.id);
    setActionError(null);
    try {
      const res: any = await SellerDashboardService.changeShopLocationStatus(
        sellerId,
        location.id,
        next,
      );
      if (!res?.success) {
        throw new Error(res?.message || t("Failed to change location status"));
      }
      // The response carries the authoritative new status — patch the row in
      // place rather than refetching the whole page.
      const applied: 0 | 1 = res?.data?.status === 0 ? 0 : res?.data?.status === 1 ? 1 : next;
      setLocations((prev) =>
        prev.map((l) => (l.id === location.id ? { ...l, status: applied } : l)),
      );
      showSuccessMessage(t("Status changed successfully"));
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "LocationsTab.toggleStatus", error: msg });
      setActionError(msg || t("Failed to change location status"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaved = (message: string) => {
    setEditing(undefined);
    showSuccessMessage(message);
    load(page);
  };

  if (!canRead) {
    return (
      <AccessDenied
        message={t("You don't have permission to view locations")}
      />
    );
  }

  const filterSelectClass =
    "h-[38px] px-3 pe-8 bg-[#f8f8f8] border border-[#ededed] rounded-[10px] text-[13px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white transition-colors";

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SectionHeader
          icon="location"
          title={t("Locations")}
          count={meta?.total ?? locations.length}
          className="mb-0"
        />
        {canCreate && (
          <DashButton size="sm" icon="plus" onClick={() => setEditing(null)}>
            {t("Add Location")}
          </DashButton>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap mt-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label={t("All statuses")}
          className={filterSelectClass}
        >
          <option value="all">{t("All statuses")}</option>
          <option value="1">{t("Active")}</option>
          <option value="0">{t("Inactive")}</option>
        </select>
      </div>

      {actionError && (
        <div className="mt-4">
          <InlineAlert tone="error">{actionError}</InlineAlert>
        </div>
      )}

      {loading ? (
        <ListRowsSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : locations.length === 0 ? (
        <div>
          <EmptyState
            icon="location"
            title={t("No locations found")}
            subtitle={t("Locations added to this shop will appear here.")}
          />
          {canCreate && status === "all" && (
            <div className="flex justify-center mt-4">
              <DashButton icon="plus" onClick={() => setEditing(null)}>
                {t("Add your first location")}
              </DashButton>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mt-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-[16px] border border-[#ededed] p-4 flex flex-col gap-3 hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-shadow"
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="w-11 h-11 shrink-0 rounded-[12px] bg-[#5d5d5d]/10 text-[#5d5d5d] flex items-center justify-center">
                    <DashIcon name="location" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] semibold text-[#3c3c3c] truncate">
                        {location.name}
                      </h3>
                      <StatusPill active={location.status === 1}>
                        {location.status === 1 ? t("Active") : t("Inactive")}
                      </StatusPill>
                    </div>
                    {location.address ? (
                      <p className="text-[12px] text-[#8e8e8e] mt-1 line-clamp-2">
                        {location.address}
                      </p>
                    ) : (
                      <p className="text-[12px] text-[#c4c2c2] mt-1 italic">
                        {t("Address")}: —
                      </p>
                    )}
                    {location.country && (
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-[#388CFF]/[0.08] text-[#388CFF] text-[11px] medium">
                        <DashIcon name="location" size={12} />
                        {location.country.nicename || location.country.name}
                      </span>
                    )}
                  </div>
                </div>

                {(canUpdate || canChangeStatus) && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4f4f4]">
                    {canUpdate && (
                      <DashButton
                        size="sm"
                        variant="secondary"
                        icon="edit"
                        onClick={() => setEditing(location)}
                      >
                        {t("Edit")}
                      </DashButton>
                    )}
                    {canChangeStatus && (
                      <DashButton
                        size="sm"
                        variant={location.status === 1 ? "danger" : "ghost"}
                        loading={togglingId === location.id}
                        onClick={() => handleToggleStatus(location)}
                      >
                        {location.status === 1 ? t("Deactivate") : t("Activate")}
                      </DashButton>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <Pagination
              current={meta.current_page || page}
              last={meta.last_page}
              disabled={loading}
              onPrev={() => load(page - 1)}
              onNext={() => load(page + 1)}
            />
          )}
        </>
      )}

      {editing !== undefined && (
        <LocationFormModal
          sellerId={sellerId}
          location={editing}
          language={language}
          canSubmit={editing ? canUpdate : canCreate}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
