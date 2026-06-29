import axios from 'axios'

const BASE_URL = 'http://localhost:5000/api/opd'

export const getAllTokens = () => axios.get(BASE_URL)

export const createToken = (data) => axios.post(BASE_URL, data)

export const updateTokenStatus = (id, status) =>
  axios.put(`${BASE_URL}/${id}`, { status })

export const deleteToken = (id) => axios.delete(`${BASE_URL}/${id}`)
