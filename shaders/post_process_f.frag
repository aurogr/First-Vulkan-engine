#version 460

layout( location = 0 ) in vec2 f_uvs;

layout ( set = 0, binding = 0 ) uniform sampler2D i_hdr;
layout ( set = 0, binding = 1 ) uniform sampler2D i_bloom;

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
    /*vec3 hdr_color = texture(i_hdr, f_uvs).rgb;

      float gamma = 2.2f;
    float exposure = 1.0f;
    vec3 mapped = vec3( 1.0f ) - exp(hdr_color * exposure);

    out_color = vec4( pow( mapped, vec3( 1.0f / gamma ) ), 1.0 );*/
      
    vec3 hdr_color = texture(i_hdr, f_uvs).rgb;
    vec3 bloom_color = texture(i_bloom, f_uvs).rgb;

    hdr_color += bloom_color; // additive blending

    // exposure
    float exposure = 1.0f;
    hdr_color = hdr_color * exposure;

    // tone mapping
    vec3 mapped = ACESFilm(hdr_color);

    // gamma correction
    float gamma = 2.2f;

    out_color = vec4( pow( mapped, vec3( 1.0f / gamma ) ), 1.0 );
}