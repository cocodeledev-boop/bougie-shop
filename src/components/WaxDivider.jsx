// Élément signature : une coulure de cire qui sépare les sections,
// comme la cire qui coule le long d'une bougie allumée.
export default function WaxDivider({ flip = false }) {
  return (
    <svg
      className="drip-divider"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      style={{ transform: flip ? 'rotate(180deg)' : 'none' }}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M0,0 L1200,0 L1200,10 C1150,10 1140,28 1100,28 C1060,28 1050,14 1010,14 C970,14 960,32 920,32 C880,32 870,12 830,12 C790,12 780,24 740,24 C700,24 690,8 650,8 C610,8 600,20 560,20 C520,20 510,30 470,30 C430,30 420,10 380,10 C340,10 330,22 290,22 C250,22 240,16 200,16 C160,16 150,26 110,26 C70,26 60,10 20,10 C10,10 5,10 0,10 Z"
      />
    </svg>
  )
}
