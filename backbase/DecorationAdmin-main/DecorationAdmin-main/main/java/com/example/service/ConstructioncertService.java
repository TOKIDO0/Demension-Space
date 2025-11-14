package com.example.service;

import com.example.entity.Constructioncert;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ConstructioncertMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ConstructioncertService extends ServiceImpl<ConstructioncertMapper, Constructioncert> {

    @Resource
    private ConstructioncertMapper constructioncertMapper;

}
