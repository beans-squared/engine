export async function headers(request, response, next) {
	response.set({
		'Content-Type': 'application/json',
	})
	next()
}
