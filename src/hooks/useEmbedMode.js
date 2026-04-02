/**
 * useEmbedMode — reads ?embed=1 from the URL.
 * When active: hides the header, removes padding, fills the viewport.
 * A "share" URL is also generated so users can copy a link.
 */
export function useEmbedMode() {
  const params  = new URLSearchParams(window.location.search);
  const isEmbed = params.get("embed") === "1";

  function getShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("embed", "1");
    return url.toString();
  }

  function copyShareUrl() {
    navigator.clipboard?.writeText(getShareUrl()).catch(() => {});
  }

  return { isEmbed, getShareUrl, copyShareUrl };
}
