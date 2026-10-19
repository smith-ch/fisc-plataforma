// Pruebas de lib/contact.ts. Se ejecutan con `npm run test` (node:test; Node 22.18+ importa .ts sin compilar).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidWhatsapp, mailtoLink, mapLink, onlyDigits, telLink, whatsappLink } from './contact.ts';

test('onlyDigits quita todo lo que no es dígito', () => {
  assert.equal(onlyDigits('+1 (809) 555-0100'), '18095550100');
  assert.equal(onlyDigits(''), '');
});

test('isValidWhatsapp acepta solo dígitos con código de país', () => {
  assert.equal(isValidWhatsapp('18095550100'), true);
  assert.equal(isValidWhatsapp(' 18095550100 '), true);
  for (const bad of ['', '0809555010', '+18095550100', '1809 555 0100', '1809555', '1234567890123456', 'abc']) {
    assert.equal(isValidWhatsapp(bad), false, bad);
  }
});

test('whatsappLink limpia el número y codifica el mensaje', () => {
  assert.equal(whatsappLink('18095550100'), 'https://wa.me/18095550100');
  assert.equal(whatsappLink('+1 (809) 555-0100', 'Hola, ¿qué tal?'), 'https://wa.me/18095550100?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F');
  assert.equal(whatsappLink('', 'Hola'), '');
});

test('telLink conserva el + y quita el formato', () => {
  assert.equal(telLink('+1 (809) 555-0100'), 'tel:+18095550100');
  assert.equal(telLink('809-555-0100'), 'tel:8095550100');
  assert.equal(telLink(''), '');
});

test('mailtoLink recorta y codifica el asunto', () => {
  assert.equal(mailtoLink(' contacto@fisc.com.do '), 'mailto:contacto@fisc.com.do');
  assert.equal(mailtoLink('a@b.co', 'Cotización & visita'), 'mailto:a@b.co?subject=Cotizaci%C3%B3n%20%26%20visita');
  assert.equal(mailtoLink(''), '');
});

test('mapLink codifica la dirección', () => {
  assert.equal(mapLink('Av. Winston Churchill #12, Santo Domingo'), 'https://www.google.com/maps/search/?api=1&query=Av.%20Winston%20Churchill%20%2312%2C%20Santo%20Domingo');
  assert.equal(mapLink('  '), '');
});
