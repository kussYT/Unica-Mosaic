'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { ArrowDown, ArrowNorthEast } from './Icons'

const subjects = [
  'Création sur mesure',
  'Recolle-toi meuf',
  'Pixel Kids',
  'Ma croix, mes couleurs',
  'Numéro de maison',
  'Atelier en groupe',
  'Autre envie',
]

export function ContactForm({ email }: { email: string }) {
  const requested = useSearchParams().get('sujet')
  const [subject, setSubject] = useState(subjects[0])
  useEffect(() => {
    if (requested && subjects.includes(requested)) setSubject(requested)
  }, [requested])
  const [draft, setDraft] = useState('')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')

  return (
    <>
      <form
        id="contact-form"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const text = `Bonjour Marie,\n\nJe vous contacte pour : ${data.get('sujet')}.\n\n${data.get('message')}\n\n${data.get('prenom')}\n${data.get('email')}`
          setDraft(text)
          setReady(true)
          setStatus('')
          if (email) {
            window.location.href = `mailto:${email}?subject=${encodeURIComponent(`UNICA — ${String(data.get('sujet'))}`)}&body=${encodeURIComponent(text)}`
          }
        }}
      >
        <label>
          Votre prénom <input name="prenom" autoComplete="given-name" required maxLength={80} placeholder="Comment vous appelez-vous ?" />
        </label>
        <label>
          Votre adresse e-mail <input type="email" name="email" autoComplete="email" required maxLength={200} placeholder="vous@exemple.fr" />
        </label>
        <label>
          Votre envie{' '}
          <select name="sujet" id="sujet" value={subject} onChange={(event) => setSubject(event.target.value)}>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Racontez-nous{' '}
          <textarea name="message" rows={5} required minLength={10} maxLength={4000} placeholder="L’idée, les couleurs, l’occasion, la période souhaitée…" />
        </label>
        <button className="button" type="submit">
          {email ? 'Préparer mon e-mail' : 'Préparer ma demande'} <span aria-hidden="true"><ArrowNorthEast /></span>
        </button>
        <p className="form-privacy">Vos informations restent dans cette page et ne sont pas transmises automatiquement.</p>
      </form>
      <div id="draft-result" hidden={!ready}>
        <h3>Votre demande est prête.</h3>
        <p id="draft-explanation">Elle n’a pas été envoyée. Vous pouvez en conserver une copie.</p>
        <textarea id="draft-text" rows={8} readOnly aria-label="Votre demande préparée" value={draft} />
        <div className="draft-actions">
          <button
            type="button"
            className="button button-small"
            id="copy-draft"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft)
                setStatus('Le texte a été copié.')
              } catch {
                setStatus('Sélectionnez et copiez le texte, ou téléchargez votre demande.')
              }
            }}
          >
            Copier le texte
          </button>
          <button
            type="button"
            className="text-link"
            id="download-draft"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }))
              const link = document.createElement('a')
              link.href = url
              link.download = 'ma-demande-unica.txt'
              link.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
              setStatus('Votre demande a été téléchargée. Elle n’a pas été envoyée.')
            }}
          >
            Télécharger (.txt) <span aria-hidden="true"><ArrowDown /></span>
          </button>
        </div>
        <p id="draft-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </>
  )
}
