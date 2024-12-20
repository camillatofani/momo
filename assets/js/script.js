let idCounter = 0; // Contatore per generare ID univoci
let linksArray = []; // Array che conterrà gli oggetti con i link e gli ID

// Funzione per estrarre i link da una pagina e restituire un array con gli oggetti
async function getLinksFromPage(url) {
	try {
		const response = await fetch(url);
		const html = await response.text();

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		const links = doc.querySelectorAll('a');
		const hrefs = [];

		// Raccogliamo tutti i link dalla pagina
		links.forEach(link => {
			const href = link.href;
			if (href.startsWith('https://psicologoinchat.it')) {
				hrefs.push(href);
			}
		});

		return hrefs;
	} catch (error) {
		console.error('Errore nel recupero della pagina:', error);
		return [];
	}
}

// Funzione per aggiungere un link nell'array se non esiste già
function addLink(link) {
	// Verifica se il link è già nell'array
	const existingLink = linksArray.find(linkData => linkData.link === link);
	if (!existingLink) {
		const newLink = {
			id: idCounter++,
			link: link,
			linksId: []
		};
		linksArray.push(newLink);
		return newLink.id;
	}
	return existingLink.id;
}

// Funzione per aggiornare il linksId per un dato link
function updateLinksId(pageId, linksOnPage) {
	const pageData = linksArray.find(linkData => linkData.id === pageId);
	if (pageData) {
		linksOnPage.forEach(link => {
			const linkId = addLink(link);
			if (!pageData.linksId.includes(linkId)) {
				pageData.linksId.push(linkId);
			}
		});
	}
}

// Funzione ricorsiva per esplorare i link e aggiornare i linksId
async function exploreLinks(url) {
	// Aggiungiamo il link iniziale
	const pageId = addLink(url);

	// Recuperiamo i link interni dalla pagina
	const linksOnPage = await getLinksFromPage(url);

	// Aggiorniamo il linksId della pagina con i link trovati
	updateLinksId(pageId, linksOnPage);

	// Esploriamo ogni link trovato
	for (const link of linksOnPage) {
		const linkId = addLink(link);
		const linkData = linksArray.find(linkData => linkData.id === linkId);
		if (linkData && linkData.linksId.length === 0) {
			// Esploriamo il link solo se non è stato già esplorato
			await exploreLinks(link);
		}
	}
}

// Funzione per stampare il risultato in formato JSON
function printLinksArray() {
	const res = document.querySelector('#res');
	res.innerHTML = JSON.stringify(linksArray, null, 2);
	res.style.display = 'block';
	// res.innerHTML = JSON.stringify(linksArray);
}

// Funzione principale per avviare l'esplorazione
async function startExploration(initialUrl) {
	await exploreLinks(initialUrl);
	// printLinksArray();
}

// Funzione per verificare link manuali
async function verifyManualLinks(manualLinks) {
	for (const link of manualLinks) {
		await exploreLinks(link);
	}
}

// // Array di link manuali da verificare
// const manualLinks = [
// 	'https://psicologoinchat.it/abbonamento/',
// 	'https://psicologoinchat.it/thank-you-page-trial/',
// ];

function goLink(link, arrOther) {
	// Eseguiamo l'esplorazione iniziale e poi verifichiamo i link manuali
	startExploration(link).then(() => {
		if (arrOther.length > 0) {
			// Verifica dei link manuali
			verifyManualLinks(arrOther).then(() => {
				printLinksArray(); // Stampa l'array finale con tutti i link esplorati
			});
		} else {
			// Se non ci sono link manuali
			printLinksArray(); // Stampa l'array finale
		}
	});
};

const btn = document.querySelector('button');
const url = document.querySelector('input');
const other = document.querySelector('textarea');
btn.addEventListener('click', () => {
	const arrOther = other.value.split(',').map(item => `https://${ item.trim() }`);
	goLink(`https://${ url.value }`, arrOther || []);
});

console.log('primo: psicologoinchat.it');
console.log('secondo: psicologoinchat.it/abbonamento/,psicologoinchat.it/thank-you-page-trial/');
