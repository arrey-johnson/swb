import { Link } from 'react-router-dom'
import { HelpCircle, Mail, Phone, MessageCircle, FileText, Shield, Wallet } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatFCFA } from '@/lib/utils'
import { DISCIPLINE_RULES } from '@/lib/discipline'
import { usePenaltyMap } from '@/lib/hooks/usePenaltyMap'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

export default function HelpPage() {
  const { getPenalty } = usePenaltyMap()
  const { t } = useLanguage()

  const FAQ = [
    {
      q: 'How do I deposit money?',
      a: 'Go to a goal and tap Deposit. Send payment via Mobile Money to the number shown, upload your payment screenshot, and wait for admin approval (usually within 24 hours).',
    },
    {
      q: 'What is the reserve balance?',
      a: `Your account requires a permanent ${formatFCFA(1000)} reserve that cannot be withdrawn. This keeps your account active and secure.`,
    },
    {
      q: 'What happens if I withdraw early?',
      a: `Early withdrawals incur a penalty based on goal duration: ${getPenalty(3)}% (3 months), ${getPenalty(6)}% (6 months), ${getPenalty(12)}% (12 months). Rates may be updated by admin.`,
    },
    {
      q: 'How long do withdrawal payouts take?',
      a: 'After you confirm a withdrawal, funds are sent to your payout phone number. Processing typically takes 1–2 business days.',
    },
    {
      q: 'How does the discipline score work?',
      a: 'Earn points by depositing each month (+20), completing goals (+100). Early withdrawals cost 50 points. Higher levels unlock perks!',
    },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 text-sm">Answers and ways to reach us</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardTitle className="text-primary mb-3">Contact Support</CardTitle>
        <div className="space-y-3 text-sm">
          <a href="mailto:support@savewithbanks.com" className="flex items-center gap-3 text-gray-700 hover:text-primary">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            support@savewithbanks.com
          </a>
          <a href="tel:+237654112103" className="flex items-center gap-3 text-gray-700 hover:text-primary">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            +237 654 112 103
          </a>
          <a
            href="https://wa.me/237654112103"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-700 hover:text-primary"
          >
            <MessageCircle className="h-5 w-5 text-primary shrink-0" />
            WhatsApp Support
          </a>
        </div>
      </Card>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <p className="font-medium text-sm text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-500 mt-1">{item.a}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t('help.penaltyIntro')}
        </h2>
        <Card className="mb-4">
          <div className="space-y-2 text-sm">
            {[3, 6, 12].map((m) => (
              <div key={m} className="flex justify-between">
                <span className="text-gray-600">{m}-month goals</span>
                <span className="font-semibold">{getPenalty(m as 3 | 6 | 12)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Discipline Points
        </h2>
        <Card>
          <div className="space-y-3">
            {DISCIPLINE_RULES.map((rule) => (
              <div key={rule.action} className="flex justify-between text-sm">
                <span className="text-gray-600">{rule.action}</span>
                <span className={`font-semibold ${rule.points.startsWith('−') ? 'text-danger' : 'text-success'}`}>
                  {rule.points} pts
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Levels: Bronze (0+), Silver (100+), Gold (300+), Platinum (500+)
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Terms & Conditions
        </CardTitle>
        <div className="text-sm text-gray-600 space-y-2 mb-4">
          <p>By using SaveWithBanks, you agree to lock your savings for the selected duration.</p>
          <p>Your account maintains a permanent {formatFCFA(1000)} reserve that cannot be withdrawn.</p>
          <p>Deposits are processed after admin verification of your payment proof.</p>
        </div>
        <Link to="/onboarding/terms" className="text-sm text-primary font-medium hover:underline">
          View full terms →
        </Link>
      </Card>

      <Card>
        <CardTitle className="mb-2 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-gray-400" />
          Quick Links
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Link to="/deposits" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary">
            My Deposits
          </Link>
          <Link to="/history/transactions" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary">
            Transactions
          </Link>
          <Link to="/history/withdrawals" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary">
            Withdrawals
          </Link>
          <Link to="/feed" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary">
            Finance Feed
          </Link>
        </div>
      </Card>
    </div>
  )
}
