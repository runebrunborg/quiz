/* eslint-disable react/no-unknown-property */
/**
 * Én stilisert SVG-scene per tema. Scenene tegnes i palettens farger og
 * brukes som bakgrunn på kategorikort og på spillskjermen. Ingen bilder,
 * ingen eksterne ressurser – alt er vektorgrafikk.
 *
 * Alle scener bruker samme viewBox og `preserveAspectRatio="xMidYMid slice"`,
 * slik at de kan strekkes til hvilket som helst format.
 */
import type { ReactElement } from 'react'

const VB = '0 0 400 260'

function Frame({ id, children, sky }: { id: string; children: React.ReactNode; sky: [string, string] }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      {children}
    </svg>
  )
}

const scenes: Record<string, () => ReactElement> = {
  /* ------------------------------------------------------------------ Blå */
  blaa: () => (
    <Frame id="s-blaa" sky={['#123AA8', '#0B1747']}>
      <circle cx="312" cy="62" r="34" fill="#FF2D8E" opacity="0.55" />
      <path
        d="M40 178c34-30 78-38 118-18 26 13 47 8 62-8 14-15 34-19 52-11 16 7 22 22 18 36-5 19-24 29-46 29H62c-16 0-27-13-22-28z"
        fill="#2F6BE8"
        opacity="0.85"
      />
      <path d="M96 176c22-26 62-28 84-2 6 7 3 14-6 14h-72c-9 0-12-6-6-12z" fill="#0B1747" opacity="0.55" />
      <g stroke="#7FB2FF" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round">
        <path d="M0 216c22-14 44-14 66 0s44 14 66 0 44-14 66 0 44 14 66 0 44-14 66 0" />
        <path d="M-20 240c22-14 44-14 66 0s44 14 66 0 44-14 66 0 44 14 66 0 44-14 66 0" />
      </g>
    </Frame>
  ),

  /* ------------------------------------------------------------------ Rød */
  rod: () => (
    <Frame id="s-rod" sky={['#8E0F3A', '#2A0A26']}>
      <circle cx="200" cy="126" r="66" fill="#FF3D2E" opacity="0.7" />
      <circle cx="200" cy="126" r="42" fill="#FF7A3D" opacity="0.7" />
      <path d="M0 200h400v60H0z" fill="#4A0A22" />
      <path
        d="M118 200c0-30 18-52 44-52-8 16-4 28 8 34-4-22 10-40 32-44-6 18 2 30 16 38 12 7 18 14 18 24z"
        fill="#FF2D8E"
        opacity="0.8"
      />
      <g fill="#FFC2DF" opacity="0.45">
        <circle cx="74" cy="52" r="4" />
        <circle cx="330" cy="76" r="3" />
        <circle cx="290" cy="38" r="2.5" />
      </g>
    </Frame>
  ),

  /* ----------------------------------------------------------------- Gull */
  gull: () => (
    <Frame id="s-gull" sky={['#7A4A05', '#2C1030']}>
      <g stroke="#F5C242" strokeWidth="8" opacity="0.35" strokeLinecap="round">
        <path d="M200 130 60 10M200 130 340 10M200 130 10 96M200 130 390 96M200 130 90 250M200 130 310 250" />
      </g>
      <circle cx="200" cy="130" r="56" fill="#F5A623" />
      <circle cx="200" cy="130" r="42" fill="#FFD778" />
      <path d="M200 104l8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3z" fill="#8A5A05" />
      <path d="M0 224h400v36H0z" fill="#2C1030" opacity="0.7" />
    </Frame>
  ),

  /* ------------------------------------------------------------- Vikinger */
  vikinger: () => (
    <Frame id="s-vikinger" sky={['#4A2496', '#15083A']}>
      <circle cx="308" cy="66" r="40" fill="#FF2D8E" opacity="0.6" />
      <path d="M0 196h400v64H0z" fill="#1B0C4A" />
      <g>
        <path d="M92 196h216l-26 30H118z" fill="#2A1560" />
        <path d="M108 196c-14-10-22-24-22-38 16 10 30 14 44 12" fill="none" stroke="#FFC2DF" strokeWidth="6" />
        <path d="M292 196c14-10 22-24 22-38-16 10-30 14-44 12" fill="none" stroke="#FFC2DF" strokeWidth="6" />
        <rect x="196" y="66" width="6" height="130" fill="#FFC2DF" />
        <path d="M202 78h74l-14 28 14 28h-74z" fill="#FF2D8E" />
        <path d="M202 78h74l-14 28 14 28h-74z" fill="none" stroke="#FFE3F1" strokeWidth="3" />
        <path d="M232 78v56M258 78v56" stroke="#FFE3F1" strokeWidth="4" opacity="0.6" />
      </g>
      <g stroke="#6D4ECF" strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round">
        <path d="M0 238c26-12 52-12 78 0s52 12 78 0 52-12 78 0 52 12 78 0 52-12 78 0" />
      </g>
    </Frame>
  ),

  /* ---------------------------------------------------------------- Japan */
  japan: () => (
    <Frame id="s-japan" sky={['#FF7FB8', '#3E1160']}>
      <circle cx="200" cy="96" r="46" fill="#FFE3F1" opacity="0.55" />
      <path d="M118 208 200 96l82 112z" fill="#2A1050" />
      <path d="M170 148 200 96l30 52-30 14z" fill="#F7F3FA" opacity="0.9" />
      <path d="M0 208h400v52H0z" fill="#1B0A38" />
      <g stroke="#8E2B6B" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M22 260V96M84 260V96" />
      </g>
      <path d="M6 88h96M12 108h84" stroke="#FF2D8E" strokeWidth="9" strokeLinecap="round" />
      <g fill="#FFC2DF">
        {[
          [300, 60],
          [326, 84],
          [352, 54],
          [372, 92],
          [316, 122],
          [356, 130],
          [286, 96],
        ].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`} opacity="0.9">
            <circle r="5" />
            <circle cx="7" cy="5" r="4" />
            <circle cx="-7" cy="5" r="4" />
            <circle cx="4" cy="-7" r="4" />
            <circle cx="-4" cy="-7" r="4" />
          </g>
        ))}
      </g>
    </Frame>
  ),

  /* ---------------------------------------------------------------- Månen */
  manen: () => (
    <Frame id="s-manen" sky={['#141A5E', '#050818']}>
      <g fill="#FFFFFF" opacity="0.8">
        {[
          [40, 40, 1.6],
          [96, 76, 1.2],
          [150, 34, 2],
          [268, 44, 1.4],
          [330, 88, 1.8],
          [372, 40, 1.2],
          [72, 132, 1.3],
          [356, 160, 1.5],
          [24, 190, 1.2],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <circle cx="212" cy="118" r="62" fill="#FFE3F1" />
      <g fill="#E5C6DA">
        <circle cx="196" cy="98" r="12" />
        <circle cx="232" cy="132" r="9" />
        <circle cx="200" cy="146" r="6" />
        <circle cx="238" cy="94" r="5" />
      </g>
      <circle cx="212" cy="118" r="62" fill="#FF2D8E" opacity="0.18" />
      <path d="M0 214c60-24 110-8 150 4s86 18 140-6 110-14 110-14v62H0z" fill="#0A0F33" />
    </Frame>
  ),

  /* ---------------------------------------------------------------- Kaffe */
  kaffe: () => (
    <Frame id="s-kaffe" sky={['#5A2E18', '#241026']}>
      <g stroke="#FFC2DF" strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M172 96c-14-16 14-26 0-42M200 92c-14-18 14-28 0-46M228 96c-14-16 14-26 0-42" />
      </g>
      <path d="M136 118h128v40c0 30-24 52-56 52h-16c-32 0-56-22-56-52z" fill="#FF2D8E" />
      <path d="M264 130h16c16 0 26 12 26 26s-10 26-26 26h-12" fill="none" stroke="#FF2D8E" strokeWidth="12" />
      <ellipse cx="200" cy="118" rx="64" ry="12" fill="#3A1A0E" />
      <rect x="104" y="212" width="192" height="12" rx="6" fill="#FFC2DF" opacity="0.8" />
      <g fill="#8A4A2B">
        <ellipse cx="52" cy="222" rx="15" ry="10" transform="rotate(-24 52 222)" />
        <ellipse cx="346" cy="212" rx="15" ry="10" transform="rotate(18 346 212)" />
      </g>
    </Frame>
  ),

  /* ----------------------------------------------------------- Kongelige */
  kongelige: () => (
    <Frame id="s-kongelige" sky={['#2A2BA8', '#0C0A3E']}>
      <g fill="#101A5A">
        <rect x="40" y="150" width="60" height="110" />
        <rect x="300" y="150" width="60" height="110" />
        <rect x="100" y="182" width="200" height="78" />
        <path d="M40 150l30-40 30 40zM300 150l30-40 30 40zM100 182l100-46 100 46z" />
      </g>
      <path d="M140 92l22 34 20-46 18 46 20-34 14 46h-108z" fill="#F5C242" />
      <rect x="132" y="138" width="136" height="14" rx="4" fill="#F5C242" />
      <g fill="#FF2D8E">
        <circle cx="182" cy="86" r="7" />
        <circle cx="200" cy="70" r="7" />
        <circle cx="218" cy="86" r="7" />
      </g>
      <g fill="#FFC2DF" opacity="0.6">
        <rect x="126" y="204" width="14" height="24" rx="7" />
        <rect x="192" y="204" width="14" height="24" rx="7" />
        <rect x="258" y="204" width="14" height="24" rx="7" />
      </g>
    </Frame>
  ),

  /* ----------------------------------------------------------------- Fjell */
  fjell: () => (
    <Frame id="s-fjell" sky={['#3E7FB8', '#12184E']}>
      <circle cx="326" cy="58" r="28" fill="#FFC2DF" opacity="0.8" />
      <path d="M0 190l84-98 62 72 44-52 76 88 62-52 72 70v42H0z" fill="#233A86" />
      <path d="M84 92l30 36-30 12-28-12zM190 112l24 28-24 10-22-10z" fill="#F7F3FA" />
      <path d="M0 214l96-64 68 44 60-30 84 52 92-38v82H0z" fill="#141B54" />
      <path d="M0 244l120-30 96 22 88-18 96 20v22H0z" fill="#FF2D8E" opacity="0.35" />
    </Frame>
  ),

  /* ---------------------------------------------------------------- Havet */
  havet: () => (
    <Frame id="s-havet" sky={['#0E7C86', '#06203A']}>
      <circle cx="86" cy="60" r="30" fill="#FF6FB5" opacity="0.7" />
      <path d="M262 60h20l10 92h-40z" fill="#F7F3FA" />
      <path d="M264 74h16M262 96h20M260 118h24" stroke="#FF2D8E" strokeWidth="8" />
      <rect x="258" y="46" width="28" height="16" rx="4" fill="#FFC94D" />
      <path d="M0 150c50-18 92 6 140 6s86-24 130-14 78 20 130 4v114H0z" fill="#0A3A52" />
      <g stroke="#3AD6E0" strokeWidth="3.5" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M-10 196c24-14 48-14 72 0s48 14 72 0 48-14 72 0 48 14 72 0 48-14 72 0" />
        <path d="M-10 224c24-14 48-14 72 0s48 14 72 0 48-14 72 0 48 14 72 0 48-14 72 0" />
        <path d="M-10 252c24-14 48-14 72 0s48 14 72 0 48-14 72 0 48 14 72 0 48-14 72 0" />
      </g>
    </Frame>
  ),

  /* ------------------------------------------------------------------ Ild */
  ild: () => (
    <Frame id="s-ild" sky={['#5E0E24', '#1C0418']}>
      <path d="M0 210l110-96 52 40 62-64 82 78 94-38v130H0z" fill="#2C0A1E" />
      <path
        d="M200 58c26 30 40 52 40 74 0 30-20 50-40 50s-40-20-40-50c0-22 14-44 40-74z"
        fill="#FF3D2E"
      />
      <path d="M200 96c14 18 22 32 22 46 0 18-10 30-22 30s-22-12-22-30c0-14 8-28 22-46z" fill="#FFC94D" />
      <g fill="#FF7A3D" opacity="0.8">
        <path d="M96 168c10 12 16 22 16 32 0 13-8 22-16 22s-16-9-16-22c0-10 6-20 16-32z" />
        <path d="M308 178c9 11 14 20 14 29 0 12-7 20-14 20s-14-8-14-20c0-9 5-18 14-29z" />
      </g>
      <path d="M0 232h400v28H0z" fill="#12030F" />
    </Frame>
  ),

  /* --------------------------------------------------------------- Rovdyr */
  rovdyr: () => (
    <Frame id="s-rovdyr" sky={['#3A2E7E', '#0C0724']}>
      <circle cx="292" cy="70" r="38" fill="#FFE3F1" opacity="0.9" />
      <g fill="#160B3E">
        <path d="M0 200l40-46 34 30 44-56 40 44 56-60 50 62 46-38 90 64v60H0z" />
      </g>
      <path
        d="M118 232c0-34 12-56 28-70l-8-32 26 18c10-4 20-6 30-6l16-26 6 30c18 10 30 32 30 56v30z"
        fill="#0B0620"
      />
      <path d="M154 176c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" fill="#FF2D8E" />
      <path d="M196 176c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" fill="#FF2D8E" />
      <path d="M0 244h400v16H0z" fill="#070418" />
    </Frame>
  ),

  /* ------------------------------------------------------------ Vin og øl */
  drikke: () => (
    <Frame id="s-drikke" sky={['#6B1038', '#26081F']}>
      <g>
        <path d="M110 66h72v34c0 20-16 36-36 36s-36-16-36-36z" fill="#FF2D8E" />
        <rect x="142" y="136" width="8" height="60" fill="#FFC2DF" />
        <rect x="118" y="196" width="56" height="10" rx="5" fill="#FFC2DF" />
      </g>
      <g>
        <rect x="234" y="96" width="66" height="110" rx="10" fill="#F5A623" opacity="0.9" />
        <rect x="234" y="96" width="66" height="24" rx="10" fill="#FFE3F1" />
        <rect x="300" y="126" width="24" height="46" rx="12" fill="none" stroke="#F5A623" strokeWidth="10" />
      </g>
      <g fill="#8E2B6B" opacity="0.8">
        {[
          [56, 150],
          [76, 162],
          [96, 150],
          [66, 172],
          [86, 174],
          [76, 190],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="11" />
        ))}
      </g>
      <path d="M0 216h400v44H0z" fill="#1A0616" />
    </Frame>
  ),

  /* ------------------------------------------------------------------ Tog */
  tog: () => (
    <Frame id="s-tog" sky={['#1F3A93', '#0A0E33']}>
      <circle cx="330" cy="56" r="30" fill="#FF5FA8" opacity="0.65" />
      <g stroke="#2A3A80" strokeWidth="6">
        <path d="M20 150v70M64 150v70M340 150v70M380 150v70" />
      </g>
      <g fill="#101A50">
        <rect x="40" y="132" width="150" height="70" rx="12" />
        <rect x="200" y="140" width="82" height="62" rx="10" />
        <rect x="292" y="140" width="82" height="62" rx="10" />
      </g>
      <g fill="#FF2D8E">
        <rect x="56" y="148" width="34" height="28" rx="6" />
        <rect x="100" y="148" width="34" height="28" rx="6" />
        <rect x="144" y="148" width="34" height="28" rx="6" />
        <rect x="214" y="154" width="26" height="24" rx="5" />
        <rect x="248" y="154" width="26" height="24" rx="5" />
        <rect x="306" y="154" width="26" height="24" rx="5" />
        <rect x="340" y="154" width="26" height="24" rx="5" />
      </g>
      <g fill="#FFC2DF">
        <circle cx="76" cy="210" r="12" />
        <circle cx="156" cy="210" r="12" />
        <circle cx="222" cy="210" r="10" />
        <circle cx="264" cy="210" r="10" />
        <circle cx="314" cy="210" r="10" />
        <circle cx="356" cy="210" r="10" />
      </g>
      <rect x="0" y="224" width="400" height="7" fill="#3A4AA0" />
      <rect x="0" y="238" width="400" height="7" fill="#26357C" />
    </Frame>
  ),

  /* ---------------------------------------------------------------- Nobel */
  nobel: () => (
    <Frame id="s-nobel" sky={['#3A2270', '#0E0A2E']}>
      <path d="M200 92l-6 84M200 92c-24-8-40 8-44 30 22 6 40-8 44-30zM200 92c24-8 40 8 44 30-22 6-40-8-44-30z" fill="none" />
      <g fill="#C79A2B" opacity="0.85">
        <path d="M140 150c-14-24-6-52 14-64 8 24 4 48-14 64zM260 150c14-24 6-52-14-64-8 24-4 48 14 64z" />
        <path d="M124 190c-22-16-24-46-10-62 16 18 20 44 10 62zM276 190c22-16 24-46 10-62-16 18-20 44-10 62z" />
      </g>
      <circle cx="200" cy="152" r="50" fill="#F5C242" />
      <circle cx="200" cy="152" r="38" fill="#FFE0A0" />
      <circle cx="200" cy="152" r="18" fill="#8A5A05" opacity="0.5" />
      <rect x="186" y="46" width="28" height="60" rx="6" fill="#FF2D8E" />
      <g fill="#FFFFFF" opacity="0.7">
        <circle cx="60" cy="60" r="2" />
        <circle cx="110" cy="38" r="1.6" />
        <circle cx="330" cy="52" r="2.2" />
        <circle cx="360" cy="106" r="1.6" />
      </g>
    </Frame>
  ),

  /* ----------------------------------------------------------- Sjokolade */
  sjokolade: () => (
    <Frame id="s-sjokolade" sky={['#4A2418', '#1E0A1A']}>
      <g transform="rotate(-8 200 140)">
        <rect x="96" y="70" width="208" height="150" rx="12" fill="#6B3A2A" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={106 + c * 50}
              y={80 + r * 47}
              width="42"
              height="39"
              rx="5"
              fill="#8A4A34"
              stroke="#4A2418"
              strokeWidth="3"
            />
          )),
        )}
      </g>
      <g fill="#FF2D8E" opacity="0.55">
        <circle cx="48" cy="200" r="16" />
        <circle cx="352" cy="76" r="13" />
        <circle cx="356" cy="216" r="9" />
      </g>
    </Frame>
  ),

  /* --------------------------------------------------------------- Vinter */
  vinter: () => (
    <Frame id="s-vinter" sky={['#3FA9D8', '#101A52']}>
      <g stroke="#FFFFFF" strokeWidth="2.5" opacity="0.75" strokeLinecap="round">
        {[
          [58, 52, 14],
          [318, 44, 11],
          [250, 92, 8],
          [110, 108, 7],
        ].map(([cx, cy, r], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <path d={`M0 ${-r}V${r}M${-r} 0H${r}`} />
            <path d={`M${-r * 0.7} ${-r * 0.7}L${r * 0.7} ${r * 0.7}M${-r * 0.7} ${r * 0.7}L${r * 0.7} ${-r * 0.7}`} />
          </g>
        ))}
      </g>
      <path d="M0 196l70-92 56 92zM150 200l58-78 56 78zM278 202l48-64 46 64z" fill="#122060" />
      <path d="M0 206c70-22 120 6 176 6s90-24 146-16 78 18 78 18v46H0z" fill="#F7F3FA" />
      <path d="M0 236c80-14 130 8 190 8s130-18 210-10v26H0z" fill="#FFE3F1" />
      <path d="M0 252c90 0 130 8 200 8s120-8 200-8v8H0z" fill="#FF6FB5" opacity="0.35" />
    </Frame>
  ),

  /* ---------------------------------------------------------------- Fugler */
  fugler: () => (
    <Frame id="s-fugler" sky={['#1E9E7A', '#0C1A46']}>
      <circle cx="86" cy="66" r="34" fill="#FFC94D" opacity="0.75" />
      <g stroke="#0A1234" strokeWidth="7" fill="none" strokeLinecap="round">
        <path d="M150 88c14-16 28-16 42 0 14-16 28-16 42 0" />
        <path d="M232 132c11-13 22-13 33 0 11-13 22-13 33 0" />
        <path d="M96 148c9-11 18-11 27 0 9-11 18-11 27 0" />
        <path d="M300 62c8-9 16-9 24 0 8-9 16-9 24 0" />
      </g>
      <path d="M0 200c60 12 100-8 150-6s86 22 140 12 110-14 110-14v68H0z" fill="#0C2A46" />
      <g>
        <path d="M60 260V150" stroke="#2A1A12" strokeWidth="12" strokeLinecap="round" />
        <path d="M60 176c22-8 44-6 62 6" stroke="#2A1A12" strokeWidth="8" strokeLinecap="round" fill="none" />
        <ellipse cx="128" cy="176" rx="20" ry="14" fill="#FF2D8E" />
        <circle cx="140" cy="170" r="9" fill="#FF5FA8" />
        <circle cx="143" cy="169" r="2.5" fill="#0C1A46" />
        <path d="M149 170l10 4-10 4z" fill="#FFC94D" />
      </g>
    </Frame>
  ),

  /* ----------------------------------------------------------------- Broer */
  broer: () => (
    <Frame id="s-broer" sky={['#2B4BE6', '#0A0E3E']}>
      <circle cx="200" cy="70" r="34" fill="#FF6FB5" opacity="0.6" />
      <g stroke="#FFC2DF" strokeWidth="4" fill="none">
        <path d="M0 168c60-70 100-70 120 0M120 168c60-70 100-70 120 0M240 168c60-70 100-70 120 0" opacity="0.85" />
      </g>
      <g stroke="#FF8AC2" strokeWidth="2" opacity="0.6">
        {Array.from({ length: 22 }, (_, i) => 12 + i * 18).map((x) => (
          <path key={x} d={`M${x} 168V${168 - Math.abs(Math.sin(((x % 120) / 120) * Math.PI)) * 62}`} />
        ))}
      </g>
      <rect x="0" y="168" width="400" height="12" fill="#F7F3FA" />
      <g fill="#101A5A">
        <rect x="112" y="96" width="16" height="130" />
        <rect x="232" y="96" width="16" height="130" />
      </g>
      <path d="M0 210c60 10 120-6 200 0s140 14 200 6v44H0z" fill="#0A1240" />
    </Frame>
  ),

  /* ------------------------------------------------------------------- Tid */
  tid: () => (
    <Frame id="s-tid" sky={['#4A2BC4', '#0E0A34']}>
      <circle cx="200" cy="128" r="76" fill="#0E0A34" stroke="#FFC2DF" strokeWidth="6" />
      <g stroke="#FF8AC2" strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6
          const r1 = 62
          const r2 = 70
          return (
            <path
              key={i}
              d={`M${200 + Math.sin(a) * r1} ${128 - Math.cos(a) * r1}L${200 + Math.sin(a) * r2} ${
                128 - Math.cos(a) * r2
              }`}
            />
          )
        })}
      </g>
      <path d="M200 128V78" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
      <path d="M200 128l38 24" stroke="#FF2D8E" strokeWidth="7" strokeLinecap="round" />
      <circle cx="200" cy="128" r="7" fill="#FF2D8E" />
      <g fill="none" stroke="#F5C242" strokeWidth="6" opacity="0.55">
        <circle cx="54" cy="212" r="26" />
        <circle cx="348" cy="60" r="20" />
      </g>
    </Frame>
  ),
  /* ---------------------------------------------------------------- Storm */
  storm: () => (
    <Frame id="s-storm" sky={['#1F3A8A', '#0A1030']}>
      <path
        d="M-10 96c40-26 96-26 136 0 24 16 56 16 80 0 34-22 84-18 114 10v52H-10z"
        fill="#2B4BB8"
        opacity="0.8"
      />
      <path d="M40 84c-16 0-28-12-28-26s12-26 28-26c6-18 24-30 44-30s38 12 44 30c18 2 32 16 32 34H40z" fill="#6E86C8" opacity="0.55" />
      <path d="M214 118l34-2-20 36 40-4-58 66 14-44-30 4z" fill="#FFD84D" />
      <g stroke="#9DB6F0" strokeWidth="4" strokeLinecap="round" opacity="0.7">
        <path d="M70 168l-22 54" />
        <path d="M108 176l-22 54" />
        <path d="M146 168l-22 54" />
        <path d="M304 172l-22 54" />
        <path d="M342 164l-22 54" />
      </g>
      <path d="M-10 236c30-14 60-14 90 0s60 14 90 0 60-14 90 0 60 14 90 0v34H-10z" fill="#0A1030" opacity="0.75" />
    </Frame>
  ),

  /* ----------------------------------------------------------------- Salt */
  salt: () => (
    <Frame id="s-salt" sky={['#0E5F72', '#07202C']}>
      <circle cx="322" cy="58" r="30" fill="#FFE9A8" opacity="0.7" />
      <path d="M-10 150h420v46H-10z" fill="#12889E" opacity="0.55" />
      <path d="M-10 178c40 10 80 10 120 0s80-10 120 0 80 10 120 0 60-8 70-4v92H-10z" fill="#E8F4F7" opacity="0.9" />
      <g fill="#FFFFFF" opacity="0.85">
        <rect x="74" y="196" width="18" height="18" transform="rotate(12 83 205)" />
        <rect x="150" y="212" width="12" height="12" transform="rotate(-18 156 218)" />
        <rect x="252" y="200" width="22" height="22" transform="rotate(24 263 211)" />
        <rect x="330" y="220" width="14" height="14" transform="rotate(-8 337 227)" />
      </g>
      <path d="M96 150c0-30 22-54 50-54s50 24 50 54z" fill="#07202C" opacity="0.35" />
    </Frame>
  ),

  /* --------------------------------------------------------------- Hjerte */
  hjerte: () => (
    <Frame id="s-hjerte" sky={['#7A0E33', '#2A0616']}>
      <path
        d="M200 224c-64-42-104-74-104-116 0-26 20-46 46-46 22 0 36 12 44 26 8-14 22-26 44-26 26 0 46 20 46 46 0 42-40 74-104 116z"
        fill="#FF3D6E"
        opacity="0.9"
      />
      <path d="M170 112c0-16 12-28 28-30" stroke="#FFC2D2" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      <g stroke="#FF8AA8" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M-10 62h80l14-24 16 48 14-24h60" />
        <path d="M226 62h60l14-24 16 48 14-24h80" />
      </g>
      <g fill="#FF7A9C" opacity="0.45">
        <path d="M48 210c-18-12-30-21-30-33 0-8 6-13 13-13 6 0 10 3 13 7 3-4 7-7 13-7 7 0 13 5 13 13 0 12-12 21-30 33z" />
        <path d="M352 206c-18-12-30-21-30-33 0-8 6-13 13-13 6 0 10 3 13 7 3-4 7-7 13-7 7 0 13 5 13 13 0 12-12 21-30 33z" />
      </g>
    </Frame>
  ),

  /* -------------------------------------------------------------- Linn */
  linn: () => (
    <Frame id="s-linn" sky={['#1E5C3A', '#0C2A1E']}>
      <g stroke="#7FD9A4" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M200 250v-88" />
        <path d="M200 162c-20 0-32 10-34 26M200 162c20 0 32 10 34 26" />
      </g>
      <g fill="#FF5FA8">
        <path d="M160 186h12c8 0 12 7 11 15l-3 18c-1 10-8 17-14 17s-13-7-14-17l-3-18c-1-8 3-15 11-15z" />
        <path d="M228 186h12c8 0 12 7 11 15l-3 18c-1 10-8 17-14 17s-13-7-14-17l-3-18c-1-8 3-15 11-15z" />
      </g>
      <g fill="#FFC2DF" opacity="0.8">
        <ellipse cx="166" cy="232" rx="12" ry="5" />
        <ellipse cx="234" cy="232" rx="12" ry="5" />
      </g>
      <g fill="#3FA66A" opacity="0.7">
        <ellipse cx="146" cy="248" rx="32" ry="12" />
        <ellipse cx="254" cy="252" rx="36" ry="12" />
      </g>
      <circle cx="320" cy="56" r="26" fill="#FFC2DF" opacity="0.35" />
    </Frame>
  ),

  /* -------------------------------------------------------------- Brun */
  brun: () => (
    <Frame id="s-brun" sky={['#4A2716', '#1C0E1E']}>
      <circle cx="316" cy="58" r="30" fill="#FFC94D" opacity="0.5" />
      <path d="M0 226c60-30 120-30 180 0s160 22 220-10v44H0z" fill="#3A1D10" opacity="0.85" />
      <g fill="#8A4A2B">
        <circle cx="164" cy="130" r="18" />
        <circle cx="236" cy="130" r="18" />
        <path d="M200 108c40 0 66 26 66 60 0 32-30 52-66 52s-66-20-66-52c0-34 26-60 66-60z" />
      </g>
      <path d="M200 158c14 0 24 8 24 18 0 12-10 20-24 20s-24-8-24-20c0-10 10-18 24-18z" fill="#C98A5E" />
      <g fill="#1C0E1E">
        <circle cx="180" cy="150" r="5" />
        <circle cx="220" cy="150" r="5" />
        <ellipse cx="200" cy="172" rx="9" ry="7" />
      </g>
    </Frame>
  ),

  /* -------------------------------------------------------------- Borg */
  borg: () => (
    <Frame id="s-borg" sky={['#1B2450', '#0A0E28']}>
      <circle cx="318" cy="54" r="24" fill="#C7B8FF" opacity="0.5" />
      <path d="M96 120h208v130H96z" fill="#3A4680" />
      <path d="M96 120h20v-22h24v22h28v-22h24v22h28v-22h24v22h28v-22h24v22h20" fill="#3A4680" />
      <path d="M60 96h56v154H60z" fill="#4A579A" />
      <path d="M284 96h56v154h-56z" fill="#4A579A" />
      <path d="M60 96h12V78h16v18h16V78h12v18" fill="#4A579A" />
      <path d="M284 96h12V78h16v18h16V78h12v18" fill="#4A579A" />
      <path d="M180 250v-58c0-11 9-20 20-20s20 9 20 20v58z" fill="#0A0E28" opacity="0.8" />
      <g fill="#FFC94D" opacity="0.85">
        <rect x="76" y="130" width="16" height="24" rx="8" />
        <rect x="308" y="130" width="16" height="24" rx="8" />
        <rect x="140" y="160" width="14" height="22" rx="7" />
        <rect x="246" y="160" width="14" height="22" rx="7" />
      </g>
    </Frame>
  ),

  /* --------------------------------------------------------------- Fot */
  fot: () => (
    <Frame id="s-fot" sky={['#0F4A32', '#0A1A22']}>
      <g fill="#FFC94D">
        <path d="M204 110c30 0 50 20 50 45 0 20-11 31-11 49 0 27-17 44-39 44s-39-17-39-44c0-18-11-29-11-49 0-25 20-45 50-45z" />
        <ellipse cx="166" cy="88" rx="15" ry="18" transform="rotate(-20 166 88)" />
        <circle cx="198" cy="72" r="11" />
        <circle cx="222" cy="70" r="10" />
        <circle cx="243" cy="76" r="9" />
        <circle cx="261" cy="88" r="7.5" />
      </g>
      <g fill="#1F7A4D" opacity="0.5">
        <path d="M74 178c17 0 28 11 28 25 0 11-6 18-6 28 0 15-9 25-22 25s-22-10-22-25c0-10-6-17-6-28 0-14 11-25 28-25z" />
        <ellipse cx="52" cy="163" rx="8" ry="10" transform="rotate(-20 52 163)" />
        <circle cx="70" cy="153" r="6" />
        <circle cx="83" cy="152" r="5.5" />
        <circle cx="95" cy="156" r="5" />
        <circle cx="105" cy="163" r="4" />
      </g>
      <path d="M0 246h400v14H0z" fill="#0A1A22" opacity="0.7" />
    </Frame>
  ),

  /* -------------------------------------------------------------- Ball */
  ball: () => (
    <Frame id="s-ball" sky={['#7A3410', '#2A1030']}>
      <g stroke="#FFC2DF" strokeWidth="4" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M40 74c26-18 52-18 78 0M28 106c34-24 68-24 102 0" />
      </g>
      <circle cx="228" cy="146" r="72" fill="#FFF3E0" />
      <g fill="#2A1030">
        <path d="M228 96l26 19-10 31h-32l-10-31z" />
        <path d="M228 74l-30 22-16-12 22-24zM228 74l30 22 16-12-22-24z" opacity="0.85" />
        <path d="M186 190l10-30-30-10-14 24zM270 190l-10-30 30-10 14 24z" opacity="0.85" />
        <path d="M212 218h32l10-30h-52z" opacity="0.85" />
      </g>
      <ellipse cx="228" cy="238" rx="70" ry="12" fill="#2A1030" opacity="0.45" />
    </Frame>
  ),

  /* ------------------------------------------------------------- Stein */
  stein: () => (
    <Frame id="s-stein" sky={['#3C4152', '#141824']}>
      <circle cx="318" cy="56" r="26" fill="#3AD6E0" opacity="0.4" />
      <g fill="#6E7488">
        <ellipse cx="200" cy="234" rx="84" ry="24" />
        <ellipse cx="196" cy="192" rx="62" ry="22" />
        <ellipse cx="204" cy="154" rx="46" ry="19" />
        <ellipse cx="198" cy="122" rx="32" ry="15" />
        <ellipse cx="202" cy="98" rx="20" ry="11" />
      </g>
      <g fill="#9AA1B5" opacity="0.65">
        <ellipse cx="176" cy="228" rx="30" ry="8" />
        <ellipse cx="182" cy="188" rx="22" ry="7" />
        <ellipse cx="192" cy="150" rx="16" ry="5" />
      </g>
      <path d="M0 250h400v10H0z" fill="#141824" opacity="0.8" />
    </Frame>
  ),

  /* --------------------------------------------------------------- Ring */
  ring: () => (
    <Frame id="s-ring" sky={['#2A2450', '#0E0C24']}>
      <g fill="none" opacity="0.35" stroke="#8FA8FF">
        <circle cx="200" cy="140" r="112" strokeWidth="3" />
        <circle cx="200" cy="140" r="136" strokeWidth="2" />
      </g>
      <circle cx="200" cy="152" r="62" fill="none" stroke="#D4A017" strokeWidth="18" />
      <circle cx="200" cy="152" r="62" fill="none" stroke="#FFE08A" strokeWidth="6" opacity="0.8" />
      <path d="M200 62l16 20-16 22-16-22z" fill="#3AD6E0" />
      <path d="M184 82h32l-16 22z" fill="#8FE8F0" opacity="0.9" />
      <g fill="#FFE08A" opacity="0.7">
        <circle cx="88" cy="72" r="4" />
        <circle cx="322" cy="98" r="3" />
        <circle cx="300" cy="52" r="5" />
      </g>
    </Frame>
  ),

  /* ---------------------------------------------------------------- Sol */
  sol: () => (
    <Frame id="s-sol" sky={['#B8560C', '#2A1030']}>
      <g stroke="#FFD54A" strokeWidth="7" opacity="0.55" strokeLinecap="round">
        <path d="M200 128V26M200 128l72-72M200 128l102-30M200 128L128 56M200 128L98 98M200 128l112 26M200 128L88 154" />
      </g>
      <circle cx="200" cy="128" r="58" fill="#FFD54A" />
      <circle cx="200" cy="128" r="44" fill="#FFF0B8" opacity="0.85" />
      <path d="M0 196h400v64H0z" fill="#2A1030" opacity="0.55" />
      <g stroke="#FF7A3D" strokeWidth="4" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M0 214c26-12 52-12 78 0s52 12 78 0 52-12 78 0 52 12 78 0 52-12 78 0" />
        <path d="M-16 240c26-12 52-12 78 0s52 12 78 0 52-12 78 0 52 12 78 0 52-12 78 0" />
      </g>
    </Frame>
  ),

  /* --------------------------------------------------------------- Natt */
  natt: () => (
    <Frame id="s-natt" sky={['#101A4A', '#05081E']}>
      <path d="M300 44a34 34 0 1 0 30 44 26 26 0 0 1-30-44z" fill="#E8EEFF" opacity="0.9" />
      <g fill="#FFFFFF" opacity="0.85">
        <circle cx="72" cy="52" r="3" />
        <circle cx="128" cy="34" r="2" />
        <circle cx="168" cy="72" r="2.5" />
        <circle cx="46" cy="96" r="2" />
        <circle cx="228" cy="42" r="2" />
        <circle cx="96" cy="120" r="1.5" />
      </g>
      <g fill="#0A1030">
        <path d="M0 260v-84h44v-30h30v30h34v-52h40v52h32v-40h38v40h44v-26h34v26h40v-44h32v44h32v84z" />
      </g>
      <g fill="#3AD6E0" opacity="0.8">
        <rect x="58" y="192" width="8" height="10" />
        <rect x="118" y="176" width="8" height="10" />
        <rect x="196" y="164" width="8" height="10" />
        <rect x="262" y="186" width="8" height="10" />
        <rect x="330" y="172" width="8" height="10" />
        <rect x="86" y="216" width="8" height="10" />
        <rect x="230" y="210" width="8" height="10" />
      </g>
    </Frame>
  ),

  /* ---------------------------------------------------------------- Hus */
  hus: () => (
    <Frame id="s-hus" sky={['#1E3A63', '#0B1430']}>
      <circle cx="322" cy="56" r="22" fill="#FFC2DF" opacity="0.4" />
      <g stroke="#C3B6D2" strokeWidth="4" fill="none" opacity="0.45" strokeLinecap="round">
        <path d="M262 62c0-12 10-20 22-16M254 44c0-14 12-22 26-18" />
      </g>
      <rect x="244" y="70" width="18" height="42" rx="9" fill="#5A4A6E" />
      <path d="M104 132l96-62 96 62v118H104z" fill="#FF5FA8" />
      <path d="M200 62l112 74H88z" fill="#8E44D8" />
      <rect x="150" y="176" width="44" height="74" rx="4" fill="#0B1430" opacity="0.8" />
      <circle cx="186" cy="214" r="4" fill="#FFC94D" />
      <g fill="#FFF0B8" opacity="0.9">
        <rect x="216" y="170" width="46" height="40" rx="4" />
      </g>
      <g stroke="#0B1430" strokeWidth="4" opacity="0.8">
        <path d="M239 170v40M216 190h46" />
      </g>
      <path d="M0 250h400v10H0z" fill="#0B1430" opacity="0.7" />
    </Frame>
  ),
}

export function ThemeScene({ scene }: { scene: string }) {
  const Comp = scenes[scene] ?? scenes.blaa
  return <Comp />
}

export const SCENE_IDS = Object.keys(scenes)
