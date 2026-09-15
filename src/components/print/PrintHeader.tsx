/**
 * SIPANDU - Kop surat resmi dokumen cetak (A4).
 * Logo resmi: /logo/logo_with_teks.png (bukan simbol placeholder).
 */
import React from "react";

interface PrintHeaderProps {
  docCode: string;
  docTitle: string;
  meta: Array<{ label: string; value: string }>;
}

export function PrintHeader({ docCode, docTitle, meta }: PrintHeaderProps) {
  return (
    <div className="print-kop">
      <div className="print-kop-row">
        <img
          src="/logo/logo_only.png"
          alt="Logo SIPANDU"
          width={120}
          height={120}
          className="print-logo"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="print-kop-text">
          <p className="print-kop-line1">Pemerintah Kota Batu · Kecamatan Junrejo</p>
          <p className="print-kop-line2">Pemerintah Desa Mojorejo</p>
          <p className="print-kop-line3">Posyandu ILP Flamboyan RW 06</p>
          <p className="print-kop-addr">
            Sekretariat: Balai RW 06 Desa Mojorejo, Kec. Junrejo, Kota Batu, Jawa Timur 65322
          </p>
        </div>
      </div>
      <div className="print-doc-title">
        <h2>{docTitle}</h2>
        <p className="print-doc-code">{docCode}</p>
      </div>
      <table className="print-meta">
        <tbody>
          {meta.map((m) => (
            <tr key={m.label}>
              <td className="print-meta-label">{m.label}</td>
              <td className="print-meta-sep">:</td>
              <td className="print-meta-value">{m.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrintSignatures({
  leftTitle,
  leftName,
  leftNote,
  rightTitle,
  rightName,
  rightNote,
}: {
  leftTitle: string;
  leftName: string;
  leftNote: string;
  rightTitle: string;
  rightName: string;
  rightNote: string;
}) {
  return (
    <div className="print-signatures">
      <div className="print-sign-col">
        <p>{leftTitle}</p>
        <p className="print-sign-name">{leftName}</p>
        <p className="print-sign-note">{leftNote}</p>
      </div>
      <div className="print-sign-col">
        <p>{rightTitle}</p>
        <p className="print-sign-name">{rightName}</p>
        <p className="print-sign-note">{rightNote}</p>
      </div>
    </div>
  );
}

export function PrintFooter({ text }: { text: string }) {
  return <p className="print-footer">{text}</p>;
}
