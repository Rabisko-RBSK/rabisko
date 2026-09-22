import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    // A pipeline VAI FALHAR se 95% das requisições demorarem mais de 500ms
    http_req_duration: ['p(95)<500'], 
    // A pipeline VAI FALHAR se a taxa de erro passar de 1%
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Substitua pela URL real do seu ambiente de homologação
  const res = http.get('https://homol.sua-api.com/health'); 
  
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}