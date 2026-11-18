export type MailResult = { sent: boolean; reason?: string }

const notifyTo = () => process.env.BOOKING_NOTIFY_EMAIL || process.env.PAYLOAD_ADMIN_EMAIL || ''

/** Prépare l’envoi. Sans service configuré, aucun faux succès. */
export async function sendBookingEmails(args: {
  toCustomer: string
  customerName: string
  workshopTitle: string
  whenLabel: string
  participants: number
  paidCents: number
  balanceCents: number
  practicalInfo?: string | null
}): Promise<{ customer: MailResult; staff: MailResult }> {
  const transport = process.env.SMTP_URL || process.env.RESEND_API_KEY || ''
  if (!transport) {
    const reason = 'Aucun service d’envoi configuré (SMTP_URL ou RESEND_API_KEY).'
    console.info('[mail]', reason, {
      customer: args.toCustomer,
      workshop: args.workshopTitle,
      paidCents: args.paidCents,
      balanceCents: args.balanceCents,
    })
    return {
      customer: { sent: false, reason },
      staff: { sent: false, reason },
    }
  }

  // Branchement réel à ajouter quand le service d’envoi sera validé.
  const reason = 'Service d’envoi présent dans l’environnement mais pas encore branché au code UNICA.'
  console.info('[mail] à brancher', reason, args)
  return {
    customer: { sent: false, reason },
    staff: { sent: false, reason: notifyTo() ? reason : 'Adresse de notification Marie absente.' },
  }
}

export const formatMoney = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
