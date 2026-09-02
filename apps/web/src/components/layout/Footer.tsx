import { FacebookIcon, InstagramIcon, YoutubeIcon } from '@/components/ui/SocialIcons'
import { Link } from 'react-router-dom'
import { useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { Logo } from '@/components/layout/Logo'

export function Footer() {
  const { data: settings } = useSettingsQuery()
  const parish = settings ?? {
    name: 'Paróquia Nossa Senhora das Graças',
    slogan: 'Uma comunidade de fé, esperança e amor.',
    address: '[ENDEREÇO DA PARÓQUIA]',
    phone: '[TELEFONE]',
    whatsapp: '[WHATSAPP]',
    email: '[E-MAIL]',
  }

  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm text-white/70">{parish.slogan}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link to="/nossa-paroquia" className="hover:text-gold">
                Nossa história
              </Link>
            </li>
            <li>
              <Link to="/nossa-paroquia#missao" className="hover:text-gold">
                Nossa missão
              </Link>
            </li>
            <li>
              <Link to="/nossa-paroquia/padre" className="hover:text-gold">
                Padre
              </Link>
            </li>
            <li>
              <Link to="/nossa-paroquia/diacono" className="hover:text-gold">
                Diácono
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-xl">Comunidade</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link to="/noticias" className="hover:text-gold">
                Notícias
              </Link>
            </li>
            <li>
              <Link to="/avisos" className="hover:text-gold">
                Avisos
              </Link>
            </li>
            <li>
              <Link to="/missas" className="hover:text-gold">
                Missas
              </Link>
            </li>
            <li>
              <Link to="/agenda" className="hover:text-gold">
                Eventos
              </Link>
            </li>
            <li>
              <Link to="/pastorais" className="hover:text-gold">
                Pastorais
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-xl">Sacramentos</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link to="/sacramentos/batismo" className="hover:text-gold">
                Batismo
              </Link>
            </li>
            <li>
              <Link to="/sacramentos/primeira-eucaristia" className="hover:text-gold">
                Eucaristia
              </Link>
            </li>
            <li>
              <Link to="/sacramentos/crisma" className="hover:text-gold">
                Crisma
              </Link>
            </li>
            <li>
              <Link to="/sacramentos/matrimonio" className="hover:text-gold">
                Matrimônio
              </Link>
            </li>
            <li>
              <Link to="/sacramentos/confissao" className="hover:text-gold">
                Confissão
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-xl">Contato</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>{parish.address}</li>
            <li>Tel.: {parish.phone}</li>
            <li>WhatsApp: {parish.whatsapp}</li>
            <li>{parish.email}</li>
          </ul>
          <div className="mt-5 flex gap-3">
            <Link target="_blank" className="rounded-full border border-white/20 p-2" aria-label="Instagram — link a definir" to='https://www.instagram.com/paroquiansdasgracas?igsi=MWFzeWN6NzBhZzk2OA%3D%3D'>
           
              <InstagramIcon size={18} />
            
    
            </Link>
            <Link target="_blank" className="rounded-full border border-white/20 p-2" aria-label="Facebook — link a definir" to='https://www.facebook.com/nsdasgracasparoquia'>
              <FacebookIcon size={18} />
            </Link>
            <Link target="_blank"  className="rounded-full border border-white/20 p-2" aria-label="YouTube — link a definir" to='https://www.youtube.com/@nsdasgracasparoquia'>
              <YoutubeIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-white/60">
        <p className="font-serif text-lg text-white">{parish.name}</p>
        <p className="mt-1 italic">{parish.slogan}</p>
        <p className="mt-3">© 2026 {parish.name}. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
