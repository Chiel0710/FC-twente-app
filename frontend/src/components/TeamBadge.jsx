// Toont het echte clublogo (aangeleverd door de opdrachtgever, uit de
// backend via team.logoUrl). Valt terug op een monogram als een team ooit
// zonder logoUrl zou zitten.
const KLEUREN = ['#A6120C', '#7C7C80', '#101010', '#D81E1E', '#4B4B4E']

function kleurVoor(naam) {
  let hash = 0
  for (let i = 0; i < naam.length; i++) {
    hash = naam.charCodeAt(i) + ((hash << 5) - hash)
  }
  return KLEUREN[Math.abs(hash) % KLEUREN.length]
}

function initialen(naam) {
  return naam
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function TeamBadge({ team, size = 'md' }) {
  if (team.logoUrl) {
    return (
      <span className={`team-badge team-badge--${size} team-badge--logo`}>
        <img src={team.logoUrl} alt={team.name} />
      </span>
    )
  }

  return (
    <span
      className={`team-badge team-badge--${size}`}
      style={{ background: kleurVoor(team.name) }}
    >
      {initialen(team.shortName || team.name)}
    </span>
  )
}
