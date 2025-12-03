import { Vaga, TipoVaga, EntidadeVaga } from "../../../components/pages/vagas/vacancy-card";
import { VagasDataProvider } from "./vagas-provider.interface";

type VagaJson = {
  id: string;
  titulo: string;
  descricao: string;
  tipoVaga: string;
  areas: string[];
  criadoEm: string;
  entidade: string;
  publicador: {
    nome: string;
    urlFotoPerfil?: string | null;
  };

  prazo: string;
  salario: string;
  sobreEmpresa: string;
  responsabilidades: string[];
  requisitos: string[];
  informacoesAdicionais: string;
  etapasProcesso: string[];
  link_vaga: string;
};

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    (id: string): VagaJson | { default: VagaJson };
  };
};

// Import JSON files
const contentContext = require.context("../../../../content/aquario-vagas", true, /\.json$/);

export class LocalFileVagasProvider implements VagasDataProvider {
  private vagasData: Record<string, VagaJson> = {};

  constructor() {
    contentContext.keys().forEach((key: string) => {
      if (!key.includes("/centro-de-informatica/")) {
        return;
      }

      const content = contentContext(key) as VagaJson | { default: VagaJson };

      const json: VagaJson = "default" in content ? content.default : content;

      if (!json.id) {
        console.warn("Arquivo JSON sem id:", key);
        return;
      }

      this.vagasData[json.id] = json;
    });
  }

  getAll(): Promise<Vaga[]> {
    const vagas = Object.keys(this.vagasData).map(id => this.jsonToVaga(this.vagasData[id]));
    return Promise.resolve(vagas);
  }

  getById(id: string): Promise<Vaga | null> {
    const data = this.vagasData[id];
    if (!data) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.jsonToVaga(data));
  }

  getByTipo(tipo: TipoVaga): Promise<Vaga[]> {
    const vagas = Object.values(this.vagasData)
      .filter(v => this.normalizeTipo(v.tipoVaga) === tipo)
      .map(v => this.jsonToVaga(v));

    return Promise.resolve(vagas);
  }

  getByEntidade(entidade: EntidadeVaga): Promise<Vaga[]> {
    const vagas = Object.values(this.vagasData)
      .filter(v => this.normalizeEntidade(v.entidade) === entidade)
      .map(v => this.jsonToVaga(v));

    return Promise.resolve(vagas);
  }

  private jsonToVaga(data: VagaJson): Vaga {
    return {
      id: data.id,
      titulo: data.titulo,
      descricao: data.descricao,
      tipoVaga: this.normalizeTipo(data.tipoVaga),
      areas: data.areas || [],
      criadoEm: data.criadoEm,
      entidade: this.normalizeEntidade(data.entidade),
      publicador: {
        nome: data.publicador.nome,
        urlFotoPerfil: data.publicador.urlFotoPerfil || null,
      },

      prazo: data.prazo,
      salario: data.salario,
      sobreEmpresa: data.sobreEmpresa,
      responsabilidades: data.responsabilidades,
      requisitos: data.requisitos,
      informacoesAdicionais: data.informacoesAdicionais,
      etapasProcesso: data.etapasProcesso,
      link_vaga: data.link_vaga,
    };
  }

  private normalizeTipo(value: string): TipoVaga {
    const t = value.trim().toUpperCase();
    return (TipoVaga as any)[t] ?? "ESTAGIO";
  }

  private normalizeEntidade(value: string): EntidadeVaga {
    const e = value.trim().toLowerCase();
    const allowed = ["laboratorios", "grupos", "ufpb", "pessoa", "externo", "ligas"];
    if (allowed.includes(e)) {
      return e as EntidadeVaga;
    }
    return "externo";
  }
}
