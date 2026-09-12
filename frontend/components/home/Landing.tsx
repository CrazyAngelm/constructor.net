import { ArrowRight, BookOpen, FloppyDisk, MagnifyingGlass, Printer, SquaresFour } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getLicenses } from '@/lib/requests/subscription'
import styles from '@/styles/home/Landing.module.scss'

const productFacts = [
	{
		icon: <MagnifyingGlass size={25} weight="bold" aria-hidden="true" />,
		title: 'Каталог и поиск',
		text: 'Находите материалы в каталоге и добавляйте их в подготовку занятия.',
	},
	{
		icon: <SquaresFour size={25} weight="bold" aria-hidden="true" />,
		title: 'Два независимых листа',
		text: 'Ведите отдельные листы для педагога и ученика в одном занятии.',
	},
	{
		icon: <FloppyDisk size={25} weight="bold" aria-hidden="true" />,
		title: 'Сохранение на сервере',
		text: 'Сохраните работу и откройте её снова в браузере.',
	},
	{
		icon: <Printer size={25} weight="bold" aria-hidden="true" />,
		title: 'Печать и PDF',
		text: 'Подготовьте листы к печати или сохранению в PDF.',
	},
]

const steps = [
	{
		number: '01',
		title: 'Найдите основу',
		text: 'Откройте каталог и воспользуйтесь поиском, чтобы выбрать нужные материалы.',
	},
	{
		number: '02',
		title: 'Соберите занятие',
		text: 'Расположите материалы на отдельных листах педагога и ученика.',
	},
	{
		number: '03',
		title: 'Сохраните результат',
		text: 'Вернитесь к сохранённой работе в браузере или подготовьте её к печати.',
	},
]

const audiences = [
	[ 'Педагогам и репетиторам', 'Для подготовки материалов к занятиям.' ],
	[ 'Методистам', 'Для работы с вариантами учебных листов.' ],
	[ 'Учебным центрам', 'Для подготовки материалов в общей веб-среде.' ],
]

const faqs = [
	[ 'Где работает Lab Studio?', 'Веб-версия открывается в браузере.' ],
	[ 'Можно ли вести листы для педагога и ученика отдельно?', 'Да. В конструкторе предусмотрены два независимых листа: для педагога и для ученика.' ],
	[ 'Сохраняется ли подготовленный материал?', 'Да. Работу можно сохранить на сервере и позднее снова открыть в браузере.' ],
	[ 'Как подготовить материал к выдаче?', 'Листы можно распечатать или сохранить в PDF.' ],
]

const Landing = () => {
	const { data: licenses, error, update } = useFetchData({}, getLicenses)

	return <main className={styles.landing}>
		<header className={styles.navbar}>
			<a className={styles.brand} href="#top" aria-label="Lab Studio, к началу страницы">
				<Image className={styles.brandMark} src="/logo.png" width={34} height={34} alt="" priority />
				<span>Lab Studio</span>
			</a>
			<nav aria-label="Основная навигация">
				<a href="#how">Как это работает</a>
				<a href="#pricing">Стоимость</a>
				<a href="#faq">Вопросы</a>
			</nav>
			<Link className={styles.navCta} href="/studio/auth">Открыть веб-версию</Link>
		</header>

		<section className={styles.hero} id="top">
			<div className={styles.heroCopy}>
				<p className={styles.eyebrow}>Lab Studio в браузере</p>
				<h1>Материалы к занятию — в одном месте.</h1>
				<p className={styles.lead}>Собирайте листы педагога и ученика из каталога, сохраняйте их на сервере и возвращайтесь к ним в браузере.</p>
				<div className={styles.heroActions}>
					<Link className={styles.primaryButton} href="/studio/auth">Открыть веб-версию <ArrowRight size={19} weight="bold" aria-hidden="true" /></Link>
					<a className={styles.textButton} href="#how">Посмотреть возможности</a>
				</div>
				<p className={styles.availability}>Текущая версия приложения остаётся доступна параллельно с веб-версией.</p>
			</div>
			<div className={styles.heroVisual} aria-hidden="true">
				<div className={styles.sheetBack} />
				<div className={styles.sheetFront}>
					<div className={styles.sheetHeader}><span /><span /></div>
					<div className={styles.sheetTitle} />
					<div className={styles.sheetRows}><i /><i /><i /><i /></div>
					<div className={styles.sheetFooter}><span>Лист педагога</span><b /></div>
				</div>
				<div className={styles.catalogChip}><BookOpen size={20} weight="bold" /> Каталог материалов</div>
				<Image className={styles.guide} src="/brand/labstudio-guide.png" width={236} height={236} alt="" priority />
			</div>
		</section>

		<section className={styles.problem}>
			<p className={styles.eyebrow}>Вместо разрозненных файлов</p>
			<h2>Один рабочий процесс: найти, собрать, сохранить, распечатать.</h2>
			<p>Lab Studio помогает держать материал занятия в одном месте — от поиска в каталоге до готового листа.</p>
		</section>

		<section className={styles.features} aria-label="Возможности Lab Studio">
			{productFacts.map((fact) => <article key={fact.title}>
				<div className={styles.featureIcon}>{fact.icon}</div>
				<h3>{fact.title}</h3>
				<p>{fact.text}</p>
			</article>)}
		</section>

		<section className={styles.steps} id="how">
			<div className={styles.sectionIntro}>
				<p className={styles.eyebrow}>Три шага</p>
				<h2>Соберите материалы к следующему занятию в привычном темпе.</h2>
			</div>
			<ol>
				{steps.map((step) => <li key={step.number}>
					<span>{step.number}</span>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</li>)}
			</ol>
		</section>

		<section className={styles.audiences}>
			<div className={styles.sectionIntro}>
				<p className={styles.eyebrow}>Кому подходит</p>
				<h2>Для тех, кто готовит материалы к занятиям.</h2>
			</div>
			<div>
				{audiences.map(([ title, text ], index) => <article key={title}>
					<span>0{index + 1}</span>
					<h3>{title}</h3>
					<p>{text}</p>
				</article>)}
			</div>
		</section>

		<section className={styles.pricing} id="pricing">
			<div className={styles.sectionIntro}>
				<p className={styles.eyebrow}>Стоимость</p>
				<h2>Актуальные тарифы</h2>
				<p>Стоимость и условия загружаются из текущего каталога тарифов.</p>
			</div>
			{!licenses && !error && <div className={styles.priceSkeleton} aria-label="Загрузка тарифов"><i /><i /><i /></div>}
			{error && <div className={styles.priceError} role="alert"><p>Не удалось загрузить тарифы.</p><button type="button" onClick={update}>Повторить</button></div>}
			{licenses && <div className={styles.priceGrid}>
				{licenses.map((license) => <article key={license.id ?? license.name}>
					<h3>{license.name}</h3>
				{license.description && <p className={styles.priceDescription}>{license.description}</p>}
					<strong>{typeof license.price === 'number' ? `${new Intl.NumberFormat('ru-RU').format(license.price)} ₽` : 'Стоимость уточняется'}</strong>
					{license.duration && <span>на {license.duration} дн.</span>}
					<Link href="/studio/auth">Открыть веб-версию <ArrowRight size={17} weight="bold" aria-hidden="true" /></Link>
				</article>)}
				{licenses.length === 0 && <p className={styles.noPrices}>Тарифы пока не опубликованы.</p>}
			</div>}
		</section>

		<section className={styles.faq} id="faq">
			<div className={styles.sectionIntro}>
				<p className={styles.eyebrow}>Вопросы и ответы</p>
				<h2>Коротко о веб-версии.</h2>
			</div>
			<div>{faqs.map(([ question, answer ]) => <details key={question}>
				<summary>{question}</summary>
				<p>{answer}</p>
			</details>)}</div>
		</section>

		<section className={styles.finalCta}>
			<div>
				<p className={styles.eyebrow}>Lab Studio в браузере</p>
				<h2>Откройте веб-версию и начните собирать материалы.</h2>
			</div>
			<Link className={styles.primaryButton} href="/studio/auth">Перейти к авторизации <ArrowRight size={19} weight="bold" aria-hidden="true" /></Link>
		</section>

		<footer className={styles.footer}>
			<div className={styles.footerBrand}><Image className={styles.brandMark} src="/logo.png" width={34} height={34} alt="" /><strong>Lab Studio</strong></div>
			<div><h2>Контакты</h2><a href="mailto:bestlaboratory@mail.ru">bestlaboratory@mail.ru</a><a href="tel:+79229800770">8-922-9800770</a><span>РФ, г. Киров</span></div>
			<div><h2>Полезные ссылки</h2><Link href="/docs">Руководства</Link><Link href="/license">Лицензионное соглашение</Link><a href="https://vk.com/studiolab">ВКонтакте</a></div>
			<div className={styles.legal}>Индивидуальный предприниматель Калашникова Виктория Владимировна<br />ОГРНИП 319435000027099<br />ИНН 434510331832</div>
		</footer>
	</main>
}

export default Landing
