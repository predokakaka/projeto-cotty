import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { CadastroBarbeariaForm } from '../../shared/models/modelo-cadastro-barbearia';
import {
  formatarCep,
  formatarDocumento,
  validarDocumento,
  cepValido,
} from '../../shared/utils/documento';
import type { TipoDocumento } from '../../shared/utils/documento';

@Component({
  selector: 'app-cadastro-barbearia',
  templateUrl: './cadastro-barbearia.page.html',
  styleUrls: ['./cadastro-barbearia.page.scss'],
  imports: [
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class CadastroBarbeariaPage {
  protected tentouValidar = false;
  protected dadosValidados = false;
  protected tipoDocumento: TipoDocumento = 'cpf';
  protected form: CadastroBarbeariaForm = this.novoFormulario();

  constructor() {
    addIcons({
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  protected aoDigitarCep(evento: CustomEvent<{ value?: string | number | null }>) {
    this.form.cep = formatarCep(String(evento.detail.value ?? ''));
    this.dadosValidados = false;
  }

  protected aoDigitarDocumento(evento: CustomEvent<{ value?: string | number | null }>) {
    this.form.cpfCnpj = formatarDocumento(String(evento.detail.value ?? ''), this.tipoDocumento);
    this.dadosValidados = false;
  }

  protected selecionarTipoDocumento(evento: CustomEvent<{ value?: string | number }>) {
    const tipo = evento.detail.value;
    if (typeof tipo !== 'string' || (tipo !== 'cpf' && tipo !== 'cnpj')) return;

    this.tipoDocumento = tipo;
    this.form.cpfCnpj = formatarDocumento(this.form.cpfCnpj, tipo);
    this.dadosValidados = false;
  }

  protected validarCadastro() {
    this.tentouValidar = true;
    this.dadosValidados = this.formularioValido();
  }

  protected alterouCampo() {
    this.dadosValidados = false;
  }

  protected campoObrigatorioValido(valor: string): boolean {
    return valor.trim().length > 0;
  }

  protected cepOk(): boolean {
    return cepValido(this.form.cep);
  }

  protected documentoOk(): boolean {
    return validarDocumento(this.form.cpfCnpj, this.tipoDocumento);
  }

  protected get documentoPlaceholder(): string {
    return this.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00';
  }

  protected get mensagemDocumentoInvalido(): string {
    return this.tipoDocumento === 'cpf' ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.';
  }

  protected get secoesConcluidas(): number {
    const sobreValido =
      this.campoObrigatorioValido(this.form.nome) &&
      this.campoObrigatorioValido(this.form.descricao);
    const localizacaoValida =
      this.cepOk() &&
      this.campoObrigatorioValido(this.form.endereco) &&
      this.campoObrigatorioValido(this.form.numero) &&
      this.campoObrigatorioValido(this.form.bairro) &&
      this.campoObrigatorioValido(this.form.cidade);
    const responsavelValido = this.documentoOk();

    return [sobreValido, localizacaoValida, responsavelValido].filter(Boolean).length;
  }

  private formularioValido(): boolean {
    return (
      this.campoObrigatorioValido(this.form.nome) &&
      this.campoObrigatorioValido(this.form.descricao) &&
      this.cepOk() &&
      this.campoObrigatorioValido(this.form.endereco) &&
      this.campoObrigatorioValido(this.form.numero) &&
      this.campoObrigatorioValido(this.form.bairro) &&
      this.campoObrigatorioValido(this.form.cidade) &&
      this.documentoOk()
    );
  }

  private novoFormulario(): CadastroBarbeariaForm {
    return {
      nome: '',
      descricao: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      cpfCnpj: '',
    };
  }
}
