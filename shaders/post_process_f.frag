#version 460

layout( location = 0 ) in vec2 f_uvs;

layout ( set = 0, binding = 0 ) uniform sampler2D i_hdr;
layout ( set = 0, binding = 1 ) uniform sampler2D i_bloom;
layout(std140, set = 0, binding = 2) uniform PostProcessData {
    float exposure;
    float chromatic_aberration_strenght;
    int tone_mapping_enabled;
    int padding1;
    // ... otros parámetros como contraste o gamma
} ubo;

layout(location = 0) out vec4 out_color;

vec3 ACESFilm(vec3 x) {
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() 
{
    // chromatic aberration
    vec2 dist = f_uvs - 0.5;
    float amount = 0.005 * ubo.chromatic_aberration_strenght; 

    float r = texture(i_hdr, f_uvs + dist * amount).r;
    float g = texture(i_hdr, f_uvs).g;
    float b = texture(i_hdr, f_uvs - dist * amount).b;

    vec3 hdr_color = vec3(r, g, b);
    vec3 bloom_color = texture(i_bloom, f_uvs).rgb;

    hdr_color += bloom_color; // additive blending
    hdr_color = hdr_color * ubo.exposure;

    // tone mapping
    if (ubo.tone_mapping_enabled != 0) {
        hdr_color = ACESFilm(hdr_color);
    }
    // gamma correction
    float gamma = 2.2f;

    out_color = vec4( pow( hdr_color, vec3( 1.0f / gamma ) ), 1.0 );
}