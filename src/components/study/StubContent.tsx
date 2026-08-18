import type { StubResponse } from "../../shared/api/types.ts";

type StubContentProps = {
  stub: StubResponse;
};

export function StubContent({ stub }: StubContentProps) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <img
          src={stub.attribution.profile_thumbnail_url}
          alt=""
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-white">{stub.attribution.account_name}</p>
          <p className="text-sm text-white/70">{stub.attribution.account_handle}</p>
        </div>
      </div>

      {stub.body_status === "not_yet_configured" || !stub.body ? (
        <p className="text-white/70">Content not yet configured.</p>
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-white/90">
          {stub.body}
        </p>
      )}
    </>
  );
}
