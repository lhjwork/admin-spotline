// 백엔드 지오코딩 API 예시 (Node.js + Express)
// 이 파일은 참고용이며, 실제 백엔드 프로젝트에 구현해야 합니다.

const express = require('express')
const axios = require('axios')
const router = express.Router()

// 네이버 지오코딩 API
router.get('/geocoding/naver', async (req, res) => {
  try {
    const { address } = req.query
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Naver API credentials not configured' })
    }

    const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
      params: {
        query: address
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET
      }
    })

    const data = response.data
    if (data.addresses && data.addresses.length > 0) {
      const { x: lng, y: lat } = data.addresses[0]
      res.json({
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        source: 'naver'
      })
    } else {
      res.status(404).json({ error: 'Address not found' })
    }
  } catch (error) {
    console.error('Naver geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

// 구글 지오코딩 API
router.get('/geocoding/google', async (req, res) => {
  try {
    const { address } = req.query
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured' })
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_API_KEY,
        region: 'kr' // 한국 지역 우선
      }
    })

    const data = response.data
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      res.json({
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        source: 'google'
      })
    } else {
      res.status(404).json({ error: 'Address not found' })
    }
  } catch (error) {
    console.error('Google geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

// 통합 지오코딩 API (여러 서비스 순차 시도)
router.get('/geocoding/unified', async (req, res) => {
  const { address } = req.query
  
  // 1차: Kakao API 시도
  try {
    const kakaoResponse = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
      params: { query: address },
      headers: {
        'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
      }
    })

    if (kakaoResponse.data.documents && kakaoResponse.data.documents.length > 0) {
      const { x: lng, y: lat } = kakaoResponse.data.documents[0]
      return res.json({
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        source: 'kakao'
      })
    }
  } catch (error) {
    console.log('Kakao geocoding failed, trying Naver...')
  }

  // 2차: Naver API 시도
  try {
    const naverResponse = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
      params: { query: address },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET
      }
    })

    if (naverResponse.data.addresses && naverResponse.data.addresses.length > 0) {
      const { x: lng, y: lat } = naverResponse.data.addresses[0]
      return res.json({
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        source: 'naver'
      })
    }
  } catch (error) {
    console.log('Naver geocoding failed, trying Google...')
  }

  // 3차: Google API 시도
  try {
    const googleResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'kr'
      }
    })

    if (googleResponse.data.results && googleResponse.data.results.length > 0) {
      const { lat, lng } = googleResponse.data.results[0].geometry.location
      return res.json({
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        source: 'google'
      })
    }
  } catch (error) {
    console.log('Google geocoding failed')
  }

  // 모든 API 실패
  res.status(404).json({ error: 'All geocoding services failed' })
})

module.exports = router

// 환경 변수 예시 (.env)
/*
KAKAO_REST_API_KEY=your_kakao_rest_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
*/