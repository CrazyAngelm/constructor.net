import styles from '@/styles/home/FAQ.module.scss'
import ExpanderFAQ from './ExpanderFAQ'

const FAQ = () => {
	return (
		<article className={styles.faq} id="faq">
			<header>Вопросы и ответы</header>
			<section>
				<hr/>
				<ExpanderFAQ question="Как понять, подойдет ли мне приложение «LAB STUDIO»?"
					answer="для того, чтобы понять, подходит ли Вам приложение, воспользуйтесь пробным периодом длительностью 14 дней" />
				<hr />
				<ExpanderFAQ question="Будут ли мои конспекты сохраняться в приложении?"
					answer="Да, все ваши конспекты и подборки заданий сохраняются на вашем ПК" />
				<hr />
				<ExpanderFAQ question="Будут ли иметь доступ к моим материалам (конспектам и подборкам заданий) другие пользователи приложения?"
					answer="Нет, ваши материалы будут доступны только Вам" />
				<hr />
				<ExpanderFAQ question="Могу ли я добавлять свои материалы в конспект или подборку задач?"
					answer="Да, есть возможность помимо заданий из базы приложения, добавлять в конспект свои материалы" />
				<hr />
			</section>
		</article>
	)
}

export default FAQ
