import React from "react";

interface UpdateDialogProps {
  fromVersion: string;
  spicyLyricsVersion: string;
}

const UpdateDialog: React.FC<UpdateDialogProps> = ({ fromVersion, spicyLyricsVersion }) => {
  return (
    <div className="update-card-wrapper slm">
      <h2 className="header">Spicy Lyrics has been successfully updated!</h2>
      <div className="card version">
        Version: {fromVersion ? `${fromVersion} → ` : ""}{spicyLyricsVersion || "Unknown"}
      </div>
      {/* Self-hosted fork: external links removed. */}
    </div>
  );
};

export default UpdateDialog;
