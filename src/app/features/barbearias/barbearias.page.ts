import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonButton,
  IonFab,
  IonFabButton,
  IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  locationOutline,
  cutOutline,
  storefrontOutline,
  searchOutline,
  addOutline,
  closeOutline,
  personAddOutline,
  moonOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { BarbeariaService } from '../../core/services/barbearia';
import { BarbeiroService } from '../../core/services/barbeiro';
import { ServicoService } from '../../core/services/servico';
import { ThemeService } from '../../core/services/theme.service';
import { Barbeiro } from '../../shared/models/modelo.barbeiro';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { Servico } from '../../shared/models/modelo.servico';
import { normalizarTexto } from '../../shared/utils/texto';

interface BarbeariaItem extends Barbearia {
  _busca: string;
  _localizacao: string;
  _categorias: string[];
}

@Component({
  selector: 'app-barbearias',
  templateUrl: 'barbearias.page.html',
  styleUrls: ['barbearias.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonImg,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonButton,
    IonFab,
    IonFabButton,
    IonModal,
  ],
})
export class BarbeariasPage {
  private barbeariaService = inject(BarbeariaService);
  private barbeiroService = inject(BarbeiroService);
  private servicoService = inject(ServicoService);
  private router = inject(Router);
  protected readonly theme = inject(ThemeService);

  @ViewChild(IonContent) private conteudo?: IonContent;
  @ViewChild('listaEstabelecimentos', { read: ElementRef })
  private listaEstabelecimentos?: ElementRef<HTMLElement>;

  protected todasBarbearias: BarbeariaItem[] = [];
  protected barbearias: BarbeariaItem[] = [];
  protected termoBusca = '';
  protected carregando = true;
  protected comErro = false;
  protected opcoesAbertas = false;

  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'location-outline': locationOutline,
      'cut-outline': cutOutline,
      'storefront-outline': storefrontOutline,
      'search-outline': searchOutline,
      'add-outline': addOutline,
      'close-outline': closeOutline,
      'person-add-outline': personAddOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
    });
  }

  public ionViewDidEnter() {
    this.buscarBarbearias();
  }

  protected atualizar(evento: any) {
    this.buscarBarbearias(() => evento.target.complete());
  }

  protected abrirBarbearia(barbearia: Barbearia) {
    if (!barbearia.barbearia_id) return;
    this.router.navigate(['/barbearia', barbearia.barbearia_id]);
  }

  protected fecharOpcoes() {
    this.opcoesAbertas = false;
  }

  protected aoFecharModal() {
    this.opcoesAbertas = false;
  }

  protected abrirOpcoes() {
    this.opcoesAbertas = true;
  }

  protected async cadastrarBarbearia() {
    this.fecharOpcoes();
    await this.router.navigate(['/cadastro-barbearia']);
  }

  protected async encontrarFiliacao() {
    this.fecharOpcoes();
      await this.router.navigate(['/filiacao']);
  }

  protected filtrar(evento?: CustomEvent) {
    if (evento?.detail?.value !== undefined) {
      this.termoBusca = evento.detail.value;
    }

    const termo = normalizarTexto(this.termoBusca).trim();
    this.barbearias = termo
      ? this.todasBarbearias.filter((b) => b._busca.includes(termo))
      : this.todasBarbearias;
  }

  protected limparBusca() {
    this.termoBusca = '';
    this.barbearias = this.todasBarbearias;
  }

  protected buscarNovamente() {
    this.buscarBarbearias();
  }

  protected async explorarEstabelecimentos() {
    const alvo = this.listaEstabelecimentos?.nativeElement;
    const conteudo = this.conteudo;
    if (!alvo || !conteudo) return;

    const areaRolagem = await conteudo.getScrollElement();
    const distancia = alvo.getBoundingClientRect().top - areaRolagem.getBoundingClientRect().top;
    await conteudo.scrollToPoint(0, areaRolagem.scrollTop + distancia, 350);
  }

  private buscarBarbearias(aoFinalizar?: () => void) {
    this.carregando = true;
    this.comErro = false;
    forkJoin({
      barbearias: this.barbeariaService.getBarbearias(),
      barbeiros: this.barbeiroService.getBarbeiros(),
      servicos: this.servicoService.getServicos(),
    }).subscribe({
      next: ({ barbearias, barbeiros, servicos }) => {
        this.todasBarbearias = this.enriquecerBarbearias(barbearias, barbeiros, servicos);
        this.filtrar();
        this.carregando = false;
        aoFinalizar?.();
      },
      error: () => {
        this.comErro = true;
        this.carregando = false;
        aoFinalizar?.();
      },
    });
  }

  private enriquecerBarbearias(
    barbearias: Barbearia[],
    barbeiros: Barbeiro[],
    servicos: Servico[]
  ): BarbeariaItem[] {
    const nomesBarbeiros = new Map(
      barbeiros.map((barbeiro) => [Number(barbeiro.id_barbeiro), barbeiro.nome])
    );

    return (Array.isArray(barbearias) ? barbearias : []).map((barbearia) => {
      const servicosDaBarbearia = (Array.isArray(servicos) ? servicos : []).filter(
        (servico) => Number(servico.barbearia_id) === Number(barbearia.barbearia_id)
      );
      const categorias = [...new Set(
        servicosDaBarbearia.map((servico) => servico.nome_servico.trim()).filter(Boolean)
      )];
      const profissionais = servicosDaBarbearia
        .map((servico) => nomesBarbeiros.get(Number(servico.barbeiro_id)))
        .filter((nome): nome is string => Boolean(nome));
      const localizacao = barbearia.endereco;
      const busca = [
        barbearia.nomeFantasia,
        barbearia.endereco,
        ...categorias,
        ...profissionais,
      ]
        .map((texto) => normalizarTexto(texto))
        .join(' ');

      return {
        ...barbearia,
        _busca: busca,
        _localizacao: localizacao,
        _categorias: categorias,
      };
    });
  }
}
