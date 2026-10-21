import { PathLayer } from '@deck.gl/layers';
import { cableProgress, type CableRenderRoute } from './cableGeometry';

const cableUniforms = {
  name: 'cable',
  vs: '',
  fs: `layout(std140) uniform cableUniforms {
    float time;
    float animate;
  } cable;`,
  uniformTypes: { time: 'f32', animate: 'f32' },
} as const;

/** A single static path mesh renders halo, core and moving packets. Updating
 * time changes a uniform, without generating paths, tessellating or uploading vertices. */
export class CableLayer extends PathLayer<CableRenderRoute, { time: number; animate: boolean }> {
  static layerName = 'CableLayer';
  static defaultProps = { ...PathLayer.defaultProps, time: 0, animate: false };

  getShaders() {
    const shaders = super.getShaders();
    return { ...shaders, modules: [...shaders.modules, cableUniforms], inject: {
      ...shaders.inject,
      'vs:#decl': 'in vec3 instanceCableProgress; out float vCableDistance;',
      'vs:#main-end': 'vCableDistance = mix(instanceCableProgress.x, instanceCableProgress.y, positions.x) - instanceCableProgress.z;',
      'fs:#decl': 'in float vCableDistance;',
      'fs:DECKGL_FILTER_COLOR': {
        order: -1,
        injection: `
          float edge = abs(geometry.uv.x);
          float core = 1.0 - smoothstep(0.14, 0.24, edge);
          float packet = cable.animate * (1.0 - step(4.0, mod(cable.time * 5.0 - vCableDistance, 26.0)));
          float packetCore = packet * (1.0 - smoothstep(0.22, 0.36, edge));
          float packetGlow = packet * (1.0 - smoothstep(0.72, 1.0, edge));
          color.rgb = mix(vec3(20.0, 184.0, 200.0), vec3(56.0, 204.0, 218.0), core) / 255.0;
          color.rgb = mix(color.rgb, vec3(100.0, 245.0, 255.0) / 255.0, packetGlow);
          color.rgb = mix(color.rgb, vec3(218.0, 255.0, 255.0) / 255.0, packetCore);
          color.a *= max(max(0.14, core * 0.67), max(packetGlow * 0.26, packetCore * 0.96));
        `,
      },
    } };
  }

  initializeState() {
    super.initializeState();
    this.getAttributeManager()!.addInstanced({
      instanceCableProgress: {
        size: 3, type: 'float32', accessor: 'getPath', noAlloc: true,
        update: attribute => { attribute.value = cableProgress(this.props.data as CableRenderRoute[]); },
      },
    });
  }

  draw(options: Parameters<PathLayer<CableRenderRoute>['draw']>[0]) {
    this.state.model?.shaderInputs.setProps({ cable: { time: this.props.time, animate: Number(this.props.animate) } });
    super.draw(options);
  }
}
