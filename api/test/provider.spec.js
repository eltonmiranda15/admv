// Chai docs - https://www.chaijs.com/api/bdd/

import { after, describe, it } from 'mocha';
import { expect } from 'chai';
import DatabaseHelper from './helpers/database-helper';
import ExpenseUtilsHelper from './helpers/expense-utils-helper';
import api from '../src/server';
import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

const { request } = chai;

const expenseHelper = new DatabaseHelper('expenses');
const expenseTypeHelper = new DatabaseHelper('expense-types');
const providerHelper = new DatabaseHelper('providers');

const { createExpenseItem } = new ExpenseUtilsHelper(
  expenseHelper,
  providerHelper,
  expenseTypeHelper
);

const ProviderTest = {
  name: 'Caso de teste',
  cpf_cnpj: '46542212723',
  email: 'teste@teste.com',
  phone: '14992345621'
};

let newProvider = {};

const alterProvider = {
  name: 'Teste de update'
};

describe('controllers/Providers', () => {
  describe('POST /providers', () => {
    it('Deve retornar o fornecedor registrado', done => {
      request(api)
        .post(`/providers`)
        .send(ProviderTest)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');

          newProvider = {
            ...res.body,
            ...ProviderTest
          };

          expect(res.body).to.eql(newProvider);
          done();
        });
    });
  });

  describe('PUT /providers/:id', () => {
    it('Deve retornar 1 para o update realizado', done => {
      request(api)
        .put(`/providers/${newProvider.id}`)
        .send(alterProvider)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.eql([1]);
          done();
        });
    });
  });

  describe('GET /providers/:id/expenses', async () => {
    it('Deve retornar as expenses relacionadas ao fornecedor', async () => {
      const newProvider = {
        cpf_cnpj: '123.456.789-0',
        name: 'Test Provider'
      };
      const { body: provider } = await providerHelper.maybeCreate(newProvider);

      const { body: newExpense } = await createExpenseItem({ id: provider.id });

      const res = await providerHelper.maybeGet('expenses');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('cpf_cnpj', newProvider.cpf_cnpj);
      expect(res.body).to.have.property('name', newProvider.name);
      expect(res.body)
        .to.have.property('expenses')
        .that.is.an('array');

      expect(res.body.expenses[0]).to.have.deep.include({
        id: newExpense.id,
        providerId: provider.id
      });
    });

    after(async () => {
      await expenseHelper.maybeDeleteAll();
      await expenseTypeHelper.maybeDeleteAll();
      await providerHelper.maybeDeleteAll();
    });
  });

  describe('GET /providers', () => {
    it('Deve retornar os fornecedores registrados', done => {
      request(api)
        .get(`/providers`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /providers/:id', () => {
    it('Deve retornar apenas o fornecedor do id que foi criado', done => {
      request(api)
        .get(`/providers/${newProvider.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');

          const newBody = res.body;
          delete newBody.createdAt;
          delete newBody.updatedAt;

          const equalProvider = newProvider;
          delete equalProvider.createdAt;
          delete equalProvider.updatedAt;
          expect(newBody).to.eql({
            ...equalProvider,
            ...alterProvider
          });
          done();
        });
    });
  });

  describe('DELETE /providers/:id', () => {
    it('Deve retornar 1 para quando o registro é deletado', done => {
      request(api)
        .delete(`/providers/${newProvider.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.equal(1);
          done();
        });
    });
  });
});
