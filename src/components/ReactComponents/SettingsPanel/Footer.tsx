import { useStore } from "@nanostores/react";
import React from "react";
import { $spicyLyricsVersion } from "../../../utils/stores.ts";

export default function Footer() {
  const version = useStore($spicyLyricsVersion);
  return (
    <div className="sl-sp-footer">
      <div className="sl-sp-footer-meta">
        <span className="sl-sp-footer-build">Self-hosted build</span>
        <span className="sl-sp-footer-version">v{version}</span>
      </div>
    </div>
  );
}
