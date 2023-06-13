import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';

const client = new ApolloClient({
	link: new HttpLink({
		uri: 'http://localhost:4000/graphql'
	}),
	cache: new InMemoryCache({
		addTypename: false
	})
});

export default client;
