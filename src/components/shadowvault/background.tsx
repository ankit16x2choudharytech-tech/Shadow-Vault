"use client";

export function Background() {
  return (
    <>
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob b1" />
        <div className="aurora-blob b2" />
        <div className="aurora-blob b3" />
        <div className="aurora-blob b4" />
      </div>
      <div className="grid-overlay" aria-hidden />
    </>
  );
}
