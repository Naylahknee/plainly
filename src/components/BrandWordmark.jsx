import wordmarkUrl from '../assets/yourkly-wordmark.svg'

export default function BrandWordmark({ className = '' }) {
  return <img className={`brand-wordmark ${className}`.trim()} src={wordmarkUrl} alt="Yourkly" />
}
