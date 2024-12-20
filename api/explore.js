import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export let idCounter = 0; // Contatore per generare ID univoci
export let linksArray = []; // Array che conterrà gli oggetti con i link e gli ID

// Funzione per estrarre i link da una pagina e restituire un array con gli oggetti
async function getLinksFromPage(url) {
	try {
		const response = await fetch(url);
		const html = await response.text();

		const dom = new JSDOM(html);
		const doc = dom.window.document;

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
	const pageId = addLink(url);

	const linksOnPage = await getLinksFromPage(url);
	updateLinksId(pageId, linksOnPage);

	for (const link of linksOnPage) {
		const linkId = addLink(link);
		const linkData = linksArray.find(linkData => linkData.id === linkId);
		if (linkData && linkData.linksId.length === 0) {
			await exploreLinks(link);
		}
	}
}

// Funzione per stampare il risultato in formato JSON
function printLinksArray() {
	return JSON.stringify(linksArray, null, 2);
}

// Funzione principale per avviare l'esplorazione
async function startExploration(initialUrl) {
	await exploreLinks(initialUrl);
	return printLinksArray();
}

// API Route per Vercel
export default async function handler(req, res) {
	const { url } = req.query;

	if (!url) {
		return res.status(400).json({ error: 'URL mancante' });
	}

	try {
		console.log(`Starting exploration for URL: ${ url }`); // Log the URL being processed
		const result = await startExploration(url);
		console.log('Exploration completed'); // Log when the exploration is complete
		res.status(200).json({ links: result });
	} catch (error) {
		console.error('Error during exploration:', error); // Log any error that occurs
		res.status(500).json({ error: 'Errore durante l\'esplorazione dei link' });
	}
}
