import { Asterisk } from './Icons'
import { Photo } from './Photo'

export function HeroCollage() {
  return (
    <div className="hero-art">
      <img className="mosaic-band mosaic-edge-shield" src="/images/mosaic/edge-shield.svg" alt="" />
      <img className="mosaic-band mosaic-edge-low" src="/images/mosaic/edge-low.svg" alt="" />
      <div className="hero-photo hero-photo-shield">
        <Photo name="blason" alt="Un blason minutieusement réalisé en mosaïque dorée, noire et rouge." eager sizes="(max-width: 760px) 72vw, 36vw" />
      </div>
      <img className="mosaic-band mosaic-edge-leopard" src="/images/mosaic/edge-leopard.svg" alt="" />
      <div className="hero-photo hero-photo-leopard">
        <Photo name="dalida" alt="Gros plan sur une création en mosaïque au motif léopard." eager sizes="(max-width: 760px) 58vw, 28vw" />
      </div>
      <div className="hero-stamp">
        CHAQUE PIÈCE
        <br />
        <em>est unique.</em>
        <span aria-hidden="true"><Asterisk /></span>
      </div>
    </div>
  )
}
