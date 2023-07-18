// Прокрутка при клике
const menuLinks = document.querySelectorAll('.menu__link[data-goto]')

if (menuLinks.length > 0) {
	menuLinks.forEach((menuLink) => {
		menuLink.addEventListener('click', onMenuLinkClick)
	})
	function onMenuLinkClick(e) {
		const menuLink = e.target
		// Проверка заполнен ли данный атрибут
		// и существуте ли объект на который ссылается данный атрибут
		if (
			menuLink.dataset.goto &&
			document.querySelector(menuLink.dataset.goto)
		) {
			const gotoBlock = document.querySelector(menuLink.dataset.goto) // Object
			// Местоположение на странице в px + кол-во прокрученный px(pageYOffset)
			// - высота шапки
			const gotoBlockValue =
				gotoBlock.getBoundingClientRect().top +
				pageYOffset -
				document.querySelector('header').offsetHeight
			if (iconMenu.classList.contains('_active')) {
				document.body.classList.remove('_lock')
				iconMenu.classList.remove('_active')
				menuBody.classList.remove('_active')
			}

			// Плавная прокрутка
			window.scrollTo({
				top: gotoBlockValue, // прокрутка сверху
				behavior: 'smooth', // прокрутка будет плавной
			})
			e.preventDefault()
		}
	}
}
