import styles from '@/styles/home/FAQ.module.scss'
import ExpanderFAQ from './ExpanderFAQ';

const FAQ = () => {
	return (
		<article className={styles.faq} id="faq">
			<header>Вопросы и ответы</header>
			<section>
				<hr/>
				<ExpanderFAQ question='Which Plan Should I Purchase?'
					answer='If you are looking to publish an application using Model Targets or Area Targets, you will need to purchase a Premium Plan. All other applications can use a Basic Plan. We currently do not have any special licenses for non-profits.' />
				<hr />
				<ExpanderFAQ question='What Are Area Targets?'
					answer='Magna enim reprehenderit consequat consectetur ea dolore ipsum quis tempor excepteur consectetur commodo cillum dolor. Labore nisi enim nostrud esse adipisicing et ea velit. Laboris ipsum pariatur aliqua aliquip magna aute ea est sit ad pariatur aute cillum aute. Do esse laborum excepteur cillum cillum nostrud deserunt nisi ad laboris duis eu sit sunt. Voluptate culpa excepteur nisi consequat laborum culpa. Aute occaecat ea nostrud aliqua.' />
				<hr />
				<ExpanderFAQ question='Which Plan Should I Purchase?'
					answer='If you are looking to publish an application using Model Targets or Area Targets, you will need to purchase a Premium Plan. All other applications can use a Basic Plan. We currently do not have any special licenses for non-profits.' />
				<hr />
				<ExpanderFAQ question='Which Plan Should I Purchase?'
					answer='If you are looking to publish an application using Model Targets or Area Targets, you will need to purchase a Premium Plan. All other applications can use a Basic Plan. We currently do not have any special licenses for non-profits.' />
				<hr />
			</section>
		</article>
	)
}

export default FAQ;
