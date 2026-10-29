A  website that shows the next Paris metro and train departures in real time, styled like the station platform screens.
The site uses the [PRIM API](https://prim.iledefrance-mobilites.fr) from Île-de-France Mobilités for live departures.
To keep the API key private, requests go through a Cloudflare Worker that uses the key.
The list of stations comes from the open data of Île-de-France Mobilités and needs no key.
