import wordmarkUrl from '../assets/brand/yourkly-wordmark.png'

export default function BrandWordmark({ className = '' }) {
  return <img className={`brand-wordmark ${className}`.trim()} src={wordmarkUrl} alt="Yourkly" />
}
